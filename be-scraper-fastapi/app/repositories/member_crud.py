from sqlalchemy.orm import Session
from app.models.member import Member

class MemberCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_member(self, member_id: int):
        return self.db.query(Member).filter(Member.id == member_id).first()
    
    def get_members(self, skip: int = 0, limit: int = 10):
        return self.db.query(Member).offset(skip).limit(limit).all()
    
    def create_member(self, member: Member):
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def update_member(self, member_id: int, member: Member):
        db_member = self.get_member(member_id)
        if db_member is None:
            return None
        for key, value in member.dict().items():
            setattr(db_member, key, value)
        self.db.commit()
        self.db.refresh(db_member)
        return db_member
    
    def delete_member(self, member_id: int):
        db_member = self.get_member(member_id)
        if db_member is None:
            return None
        self.db.delete(db_member)
        self.db.commit()
        return db_member
    
    def get_member_by_email(self, email: str):
        return self.db.query(Member).filter(Member.email == email).first()
    
    def get_member_by_membership_number(self, membership_number: str):
        return self.db.query(Member).filter(Member.membership_number == membership_number).first()
    
    def get_member_by_phone(self, phone: str):
        return self.db.query(Member).filter(Member.phone == phone).first()
    
    def get_member_by_name(self, name: str):
        return self.db.query(Member).filter(Member.en_name == name).first()
    
    def get_all_members_by_university(self, university: str):
        return self.db.query(Member).filter(Member.university == university).all()
    
    def get_all_members_by_major(self, major: str):
        return self.db.query(Member).filter(Member.major == major).all()
    
    def get_all_member_by_year(self, year: int):
        return self.db.query(Member).filter(Member.year == year).all()
    
    def get_all_members_by_country(self, country: str):
        return self.db.query(Member).filter(Member.country == country).all()
    
    def get_all_members_by_city(self, city: str):
        return self.db.query(Member).filter(Member.city == city).all()
    
    def get_all_members_by_district(self, district: str):
        return self.db.query(Member).filter(Member.district == district).all()
    
    def get_all_members_by_status(self, status: str):
        return self.db.query(Member).filter(Member.status == status).all()
    
    def get_all_members_by_is_advisor(self, is_advisor: bool):
        return self.db.query(Member).filter(Member.is_advisor == is_advisor).all()
    
    def get_all_members_by_is_leader(self, is_leader: bool):
        return self.db.query(Member).filter(Member.is_leader == is_leader).all()
    
    def get_all_members_by_skill(self, skill: str):
        return self.db.query(Member).filter(Member.skills.contains(skill)).all()
    
    def get_all_members_by_rating(self, rating: int):
        return self.db.query(Member).filter(Member.rating == rating).all()
    
    def get_all_members_by_team_id(self, team_id: int):
        return self.db.query(Member).filter(Member.team_ids.contains(team_id)).all()
        

    
