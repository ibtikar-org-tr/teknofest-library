from app.initializers.d1_client import d1_client
from app.models.member import Member
from typing import Optional, List
import json
import uuid
from datetime import datetime

class MemberCRUD:
    """Cloudflare D1 implementation of MemberCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    async def get_member(self, member_id: int) -> Optional[Member]:
        """Get a member by ID"""
        sql = "SELECT * FROM members WHERE id = ?"
        result = await self.client.execute(sql, [str(member_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_member(result["results"][0])
        return None
    
    async def get_members(self, skip: int = 0, limit: int = 10) -> List[Member]:
        """Get paginated list of members"""
        sql = "SELECT * FROM members LIMIT ? OFFSET ?"
        result = await self.client.execute(sql, [limit, skip])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def create_member(self, member: Member) -> Member:
        """Create a new member"""
        member_id = str(member.id or uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO members (
            id, created_at, updated_at, deleted_at, ar_name, en_name,
            membership_number, email, phone, university, major, year,
            sex, birthdate, country, city, district, team_ids,
            status, is_advisor, is_leader, skills, rating, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            member_id, now, now, None,
            member.ar_name, member.en_name, member.membership_number,
            member.email, member.phone, member.university, member.major, member.year,
            member.sex, member.birthdate.isoformat() if member.birthdate else None,
            member.country, member.city, member.district,
            json.dumps([str(tid) for tid in member.team_ids]) if member.team_ids else None,
            member.status, member.is_advisor, member.is_leader,
            json.dumps(member.skills) if member.skills else None,
            member.rating,
            json.dumps([str(cid) for cid in member.comments]) if member.comments else None
        ]
        
        await self.client.execute(sql, params)
        member.id = uuid.UUID(member_id)
        return member
    
    async def update_member(self, member_id: int, member: Member) -> Optional[Member]:
        """Update an existing member"""
        db_member = await self.get_member(member_id)
        if db_member is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE members SET
            updated_at = ?, ar_name = ?, en_name = ?,
            membership_number = ?, email = ?, phone = ?, university = ?, major = ?, year = ?,
            sex = ?, birthdate = ?, country = ?, city = ?, district = ?, team_ids = ?,
            status = ?, is_advisor = ?, is_leader = ?, skills = ?, rating = ?, comments = ?
        WHERE id = ?
        """
        
        params = [
            now, member.ar_name, member.en_name, member.membership_number,
            member.email, member.phone, member.university, member.major, member.year,
            member.sex, member.birthdate.isoformat() if member.birthdate else None,
            member.country, member.city, member.district,
            json.dumps([str(tid) for tid in member.team_ids]) if member.team_ids else None,
            member.status, member.is_advisor, member.is_leader,
            json.dumps(member.skills) if member.skills else None,
            member.rating,
            json.dumps([str(cid) for cid in member.comments]) if member.comments else None,
            str(member_id)
        ]
        
        await self.client.execute(sql, params)
        return await self.get_member(member_id)
    
    async def delete_member(self, member_id: int) -> Optional[Member]:
        """Delete a member"""
        db_member = await self.get_member(member_id)
        if db_member is None:
            return None
        
        sql = "DELETE FROM members WHERE id = ?"
        await self.client.execute(sql, [str(member_id)])
        return db_member
    
    async def get_member_by_email(self, email: str) -> Optional[Member]:
        """Get member by email"""
        sql = "SELECT * FROM members WHERE email = ? LIMIT 1"
        result = await self.client.execute(sql, [email])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_member(result["results"][0])
        return None
    
    async def get_member_by_membership_number(self, membership_number: str) -> Optional[Member]:
        """Get member by membership number"""
        sql = "SELECT * FROM members WHERE membership_number = ? LIMIT 1"
        result = await self.client.execute(sql, [membership_number])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_member(result["results"][0])
        return None
    
    async def get_member_by_phone(self, phone: str) -> Optional[Member]:
        """Get member by phone"""
        sql = "SELECT * FROM members WHERE phone = ? LIMIT 1"
        result = await self.client.execute(sql, [phone])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_member(result["results"][0])
        return None
    
    async def get_member_by_name(self, name: str) -> Optional[Member]:
        """Get member by English name"""
        sql = "SELECT * FROM members WHERE en_name = ? LIMIT 1"
        result = await self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_member(result["results"][0])
        return None
    
    async def get_all_members_by_university(self, university: str) -> List[Member]:
        """Get all members by university"""
        sql = "SELECT * FROM members WHERE university = ?"
        result = await self.client.execute(sql, [university])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_major(self, major: str) -> List[Member]:
        """Get all members by major"""
        sql = "SELECT * FROM members WHERE major = ?"
        result = await self.client.execute(sql, [major])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_member_by_year(self, year: int) -> List[Member]:
        """Get all members by year"""
        sql = "SELECT * FROM members WHERE year = ?"
        result = await self.client.execute(sql, [year])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_country(self, country: str) -> List[Member]:
        """Get all members by country"""
        sql = "SELECT * FROM members WHERE country = ?"
        result = await self.client.execute(sql, [country])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_city(self, city: str) -> List[Member]:
        """Get all members by city"""
        sql = "SELECT * FROM members WHERE city = ?"
        result = await self.client.execute(sql, [city])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_district(self, district: str) -> List[Member]:
        """Get all members by district"""
        sql = "SELECT * FROM members WHERE district = ?"
        result = await self.client.execute(sql, [district])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_status(self, status: str) -> List[Member]:
        """Get all members by status"""
        sql = "SELECT * FROM members WHERE status = ?"
        result = await self.client.execute(sql, [status])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_is_advisor(self, is_advisor: bool) -> List[Member]:
        """Get all members by advisor status"""
        sql = "SELECT * FROM members WHERE is_advisor = ?"
        result = await self.client.execute(sql, [1 if is_advisor else 0])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_is_leader(self, is_leader: bool) -> List[Member]:
        """Get all members by leader status"""
        sql = "SELECT * FROM members WHERE is_leader = ?"
        result = await self.client.execute(sql, [1 if is_leader else 0])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_skill(self, skill: str) -> List[Member]:
        """Get all members by skill"""
        sql = "SELECT * FROM members WHERE skills LIKE ?"
        result = await self.client.execute(sql, [f'%{skill}%'])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                member = self._row_to_member(row)
                if member.skills and skill in member.skills:
                    members.append(member)
        return members
    
    async def get_all_members_by_rating(self, rating: int) -> List[Member]:
        """Get all members by rating"""
        sql = "SELECT * FROM members WHERE rating = ?"
        result = await self.client.execute(sql, [rating])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                members.append(self._row_to_member(row))
        return members
    
    async def get_all_members_by_team_id(self, team_id: int) -> List[Member]:
        """Get all members by team ID"""
        sql = "SELECT * FROM members WHERE team_ids LIKE ?"
        result = await self.client.execute(sql, [f'%{str(team_id)}%'])
        
        members = []
        if result.get("results"):
            for row in result["results"]:
                member = self._row_to_member(row)
                if member.team_ids and team_id in [tid for tid in member.team_ids]:
                    members.append(member)
        return members
    
    def _row_to_member(self, row: dict) -> Member:
        """Convert database row to Member model"""
        team_ids_data = row.get("team_ids")
        if isinstance(team_ids_data, str):
            try:
                team_ids = [uuid.UUID(tid) for tid in json.loads(team_ids_data)]
            except:
                team_ids = None
        else:
            team_ids = team_ids_data
        
        skills_data = row.get("skills")
        if isinstance(skills_data, str):
            try:
                skills = json.loads(skills_data)
            except:
                skills = None
        else:
            skills = skills_data
        
        comments_data = row.get("comments")
        if isinstance(comments_data, str):
            try:
                comments = [uuid.UUID(cid) for cid in json.loads(comments_data)]
            except:
                comments = None
        else:
            comments = comments_data
        
        return Member(
            id=uuid.UUID(row["id"]) if row.get("id") else None,
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            ar_name=row["ar_name"],
            en_name=row["en_name"],
            membership_number=row["membership_number"],
            email=row["email"],
            phone=row["phone"],
            university=row["university"],
            major=row["major"],
            year=row["year"],
            sex=row["sex"],
            birthdate=datetime.fromisoformat(row["birthdate"]) if row.get("birthdate") else datetime.utcnow(),
            country=row["country"],
            city=row["city"],
            district=row["district"],
            team_ids=team_ids,
            status=row["status"],
            is_advisor=bool(row["is_advisor"]),
            is_leader=bool(row["is_leader"]),
            skills=skills,
            rating=row["rating"],
            comments=comments
        )
