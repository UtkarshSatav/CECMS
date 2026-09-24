import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app, lifespan

async def test_full_workflow():
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Login as Super Admin
            res = await client.post("/auth/login", data={"username": "superadmin@cecms.com", "password": "admin123"})
            assert res.status_code == 200, f"Super admin login failed: {res.text}"
            super_token = res.json()["access_token"]
            super_headers = {"Authorization": f"Bearer {super_token}"}
            print("✓ Step 1: Super Admin logged in successfully")

            # 2. Super Admin creates an Admin
            res = await client.post("/auth/admin/create-user", json={
                "email": "officer@cecms.com",
                "password": "officer123",
                "full_name": "Club Officer Admin",
                "role": "ADMIN"
            }, headers=super_headers)
            if res.status_code == 400 and "already registered" in res.text:
                pass
            else:
                assert res.status_code == 200, f"Admin creation failed: {res.text}"
            print("✓ Step 2: Super Admin created Admin account (officer@cecms.com)")

            # 3. Login as Admin
            res = await client.post("/auth/login", data={"username": "officer@cecms.com", "password": "officer123"})
            assert res.status_code == 200, f"Admin login failed: {res.text}"
            admin_token = res.json()["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            print("✓ Step 3: Admin logged in successfully")

            # 4. Admin submits Club Creation Request
            res = await client.post("/club-requests/", json={
                "name": "AI & Robotics Club",
                "description": "Building autonomous drones and AI systems",
                "category": "Technology"
            }, headers=admin_headers)
            if res.status_code == 400 and "already exists" in res.text:
                res_all = await client.get("/club-requests/", headers=admin_headers)
                club_req = [r for r in res_all.json() if r["name"] == "AI & Robotics Club"][0]
            else:
                assert res.status_code == 200, f"Club request failed: {res.text}"
                club_req = res.json()
            club_req_id = club_req["id"]
            print(f"✓ Step 4: Admin created Club Request (ID: {club_req_id})")

            # 5. Super Admin Approves Club Request
            if club_req["status"] == "PENDING":
                res = await client.put(f"/club-requests/{club_req_id}/decision", json={
                    "status": "APPROVED"
                }, headers=super_headers)
                assert res.status_code == 200, f"Super admin approval failed: {res.text}"
                print("✓ Step 5: Super Admin approved Club Request -> Club created")
            else:
                print("✓ Step 5: Club Request was already approved")

            # Verify club exists
            res = await client.get("/clubs/")
            clubs = res.json()
            club = [c for c in clubs if c["name"] == "AI & Robotics Club"][0]
            club_id = club["id"]
            print(f"✓ Club is ACTIVE with ID: {club_id}")

            # 6. Admin Allots Student and Sets as Club Leader
            res = await client.get("/clubs/students/available", headers=admin_headers)
            students = res.json()
            student = [s for s in students if s["email"] == "student@cecms.com"][0]
            student_id = student["id"]

            res = await client.post(f"/clubs/{club_id}/allot-student", json={
                "student_id": student_id,
                "is_leader": True
            }, headers=admin_headers)
            assert res.status_code == 200, f"Allotment failed: {res.text}"
            print(f"✓ Step 6: Admin allotted student ({student['email']}) as Club Leader for club {club_id}")

            # 7. Student (Club Leader) logs in and checks profile
            res = await client.post("/auth/login", data={"username": "student@cecms.com", "password": "student123"})
            assert res.status_code == 200, f"Student login failed: {res.text}"
            student_token = res.json()["access_token"]
            student_headers = {"Authorization": f"Bearer {student_token}"}
            user_data = res.json()["user"]
            assert user_data["is_club_leader"] == True, "User should be marked as club leader"
            print("✓ Step 7: Student logged in and verified as Club Leader")

            # 8. Club Leader creates Event Request with proposed budget
            res = await client.post("/event-requests/", json={
                "club_id": club_id,
                "title": "Autonomous Drone Workshop",
                "description": "Hands-on workshop on assembling and programming quadcopters",
                "event_date": "2026-10-15T10:00:00Z",
                "venue": "Engineering Hall 101",
                "capacity": 40,
                "proposed_budget": 750.0,
                "budget_breakdown": "Drone kits: $500, Safety gear: $150, Refreshments: $100"
            }, headers=student_headers)
            assert res.status_code == 200, f"Event request failed: {res.text}"
            ev_req = res.json()
            ev_req_id = ev_req["id"]
            print(f"✓ Step 8: Club Leader created Event Request with proposed budget ${ev_req['proposed_budget']}")

            # 9. Admin Approves Event Request -> creates published Event
            res = await client.put(f"/event-requests/{ev_req_id}/decision", json={
                "status": "APPROVED",
                "admin_notes": "Great initiative. Approved for official scheduling."
            }, headers=admin_headers)
            assert res.status_code == 200, f"Event request approval failed: {res.text}"
            approved_ev_req = res.json()
            published_event_id = approved_ev_req["event_id"]
            assert published_event_id is not None
            print(f"✓ Step 9: Admin approved Event Request -> Published Event created (ID: {published_event_id})")

            # 10. Admin creates Budget Request based on student proposed amount
            res = await client.post("/budget-requests/", json={
                "club_id": club_id,
                "event_request_id": ev_req_id,
                "title": "Budget for Autonomous Drone Workshop",
                "amount": 750.0,
                "justification": "Parts and hardware for 40 participants as detailed by Club Leader."
            }, headers=admin_headers)
            assert res.status_code == 200, f"Budget request failed: {res.text}"
            budget_req = res.json()
            budget_req_id = budget_req["id"]
            print(f"✓ Step 10: Admin created Budget Request for Super Admin (${budget_req['amount']})")

            # 11. Super Admin Approves Budget Request
            res = await client.put(f"/budget-requests/{budget_req_id}/decision", json={
                "status": "APPROVED",
                "remarks": "Approved in full from engineering student activities fund."
            }, headers=super_headers)
            assert res.status_code == 200, f"Budget approval failed: {res.text}"
            print("✓ Step 11: Super Admin approved the Budget Request!")

            # 12. Student registers for the published Event
            res = await client.post(f"/registrations/{published_event_id}", headers=student_headers)
            assert res.status_code == 200, f"Registration failed: {res.text}"
            print("✓ Step 12: Student registered for the approved published event!")

            # 13. Reports Dashboard check
            res = await client.get("/reports/dashboard", headers=super_headers)
            assert res.status_code == 200
            stats = res.json()
            print("✓ Step 13: Reports metrics verified:", stats)

            print("\n==========================================")
            print("🎉 ALL 3-TIER RBAC WORKFLOW TESTS PASSED!")
            print("==========================================")

if __name__ == "__main__":
    asyncio.run(test_full_workflow())
