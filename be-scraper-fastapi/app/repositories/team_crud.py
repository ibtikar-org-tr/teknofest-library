from sqlalchemy.orm import Session
from app.models.team import Team
from app.initializers.db import engine

class TeamCRUD:
    def __init__(self):
        self.db = Session(engine)

    def get_team(self, team_id: int):
        return self.db.query(Team).filter(Team.id == team_id).first()
    
    def get_teams(self, skip: int = 0, limit: int = 10):
        return self.db.query(Team).offset(skip).limit(limit).all()
    
    def create_team(self, team: Team):
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)
        return team
    
    def update_team(self, team_id: int, team: Team):
        db_team = self.get_team(team_id)
        if db_team is None:
            return None
        for key, value in team.dict().items():
            setattr(db_team, key, value)
        self.db.commit()
        self.db.refresh(db_team)
        return db_team
    
    def delete_team(self, team_id: int):
        db_team = self.get_team(team_id)
        if db_team is None:
            return None
        self.db.delete(db_team)
        self.db.commit()
        return db_team
    
    def get_team_by_name(self, name: str):
        return self.db.query(Team).filter(Team.name == name).first()
    
    def get_teams_by_stage(self, stage: str):
        return self.db.query(Team).filter(Team.stage == stage).all()
    
    def get_teams_by_member_count(self, member_count: int):
        return self.db.query(Team).filter(Team.member_count == member_count).all()
    
    def get_teams_by_leader(self, leader: int):
        return self.db.query(Team).filter(Team.leader == leader).all()
    
    def get_teams_by_competition_id(self, competition_id: int):
        return self.db.query(Team).filter(Team.competition_id == competition_id).all()
    
    def get_teams_by_year(self, year: str):
        return self.db.query(Team).filter(Team.years.contains(year)).all()
    
    def get_teams_by_status(self, status: str):
        return self.db.query(Team).filter(Team.status == status).all()
    
    def get_teams_by_rank(self, rank: int):
        return self.db.query(Team).filter(Team.rank == rank).all()
    
    def get_teams_by_relation(self, relation: str):
        return self.db.query(Team).filter(Team.relation == relation).all()
    
    def get_team_by_competition_id_and_name(self, competition_id, name: str):
        return self.db.query(Team).filter(Team.competition_id == competition_id, Team.name == name).first()
    
    def get_teams_by_competition_id_and_year(self, competition_id: int, year: str):
        return self.db.query(Team).filter(Team.competition_id == competition_id, Team.years.contains(year)).all()
    
    def get_teams_by_competition_id_and_status(self, competition_id: int, status: str):
        return self.db.query(Team).filter(Team.competition_id == competition_id, Team.status == status).all()
    
    def get_teams_by_competition_id_and_rank(self, competition_id: int, rank: int):
        return self.db.query(Team).filter(Team.competition_id == competition_id, Team.rank == rank).all()
    
    def get_teams_by_competition_id_and_relation(self, competition_id: int, relation: str):
        return self.db.query(Team).filter(Team.competition_id == competition_id, Team.relation == relation).all()
    
    def get_team_by_name_and_year(self, name: str, year: str):
        return self.db.query(Team).filter(Team.name == name, Team.years.contains([year])).first()