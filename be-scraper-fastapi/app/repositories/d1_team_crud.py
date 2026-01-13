from app.initializers.d1_client import d1_client
from app.models.team import Team
from typing import Optional, List
import json
import uuid
from datetime import datetime

class TeamCRUD:
    """Cloudflare D1 implementation of TeamCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_team(self, team_id: uuid.UUID) -> Optional[Team]:
        """Get a team by ID"""
        sql = "SELECT * FROM teams WHERE id = ?"
        result = self.client.execute(sql, [str(team_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_team(result["results"][0])
        return None
    
    def get_teams(self, skip: int = 0, limit: int = 10) -> List[Team]:
        """Get paginated list of teams"""
        sql = "SELECT * FROM teams LIMIT ? OFFSET ?"
        result = self.client.execute(sql, [limit, skip])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def create_team(self, team: Team) -> Team:
        """Create a new team"""
        team_id = str(team.id or uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO teams (
            id, name, created_at, updated_at, deleted_at, description, stage,
            institution_name, member_count, tap_members, members_list, leader,
            competition_id, years, status, rank, relation, intro_file_path, team_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            team_id, team.name, now, now, None,
            team.description, team.stage, team.institution_name, team.member_count,
            json.dumps([str(mid) for mid in team.tap_members]) if team.tap_members else None,
            json.dumps(team.members_list) if team.members_list else None,
            str(team.leader) if team.leader else None,
            str(team.competition_id),
            json.dumps(team.years) if team.years else json.dumps([]),
            team.status, team.rank, team.relation,
            team.intro_file_path, team.team_link
        ]
        
        self.client.execute(sql, params)
        team.id = uuid.UUID(team_id)
        return team
    
    def update_team(self, team_id: uuid.UUID, team: Team) -> Optional[Team]:
        """Update an existing team"""
        db_team = self.get_team(team_id)
        if db_team is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE teams SET
            name = ?, updated_at = ?, description = ?, stage = ?,
            institution_name = ?, member_count = ?, tap_members = ?, members_list = ?, leader = ?,
            competition_id = ?, years = ?, status = ?, rank = ?, relation = ?,
            intro_file_path = ?, team_link = ?
        WHERE id = ?
        """
        
        params = [
            team.name, now, team.description, team.stage,
            team.institution_name, team.member_count,
            json.dumps([str(mid) for mid in team.tap_members]) if team.tap_members else None,
            json.dumps(team.members_list) if team.members_list else None,
            str(team.leader) if team.leader else None,
            str(team.competition_id),
            json.dumps(team.years) if team.years else json.dumps([]),
            team.status, team.rank, team.relation,
            team.intro_file_path, team.team_link,
            str(team_id)
        ]
        
        self.client.execute(sql, params)
        return self.get_team(team_id)
    
    def delete_team(self, team_id: uuid.UUID) -> Optional[Team]:
        """Delete a team"""
        db_team = self.get_team(team_id)
        if db_team is None:
            return None
        
        sql = "DELETE FROM teams WHERE id = ?"
        self.client.execute(sql, [str(team_id)])
        return db_team
    
    def get_team_by_name(self, name: str) -> Optional[Team]:
        """Get team by name"""
        sql = "SELECT * FROM teams WHERE name = ? LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_team(result["results"][0])
        return None
    
    def get_teams_by_stage(self, stage: str) -> List[Team]:
        """Get teams by stage"""
        sql = "SELECT * FROM teams WHERE stage = ?"
        result = self.client.execute(sql, [stage])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_member_count(self, member_count: int) -> List[Team]:
        """Get teams by member count"""
        sql = "SELECT * FROM teams WHERE member_count = ?"
        result = self.client.execute(sql, [member_count])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_leader(self, leader: int) -> List[Team]:
        """Get teams by leader"""
        sql = "SELECT * FROM teams WHERE leader = ?"
        result = self.client.execute(sql, [str(leader)])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_competition_id(self, competition_id: int) -> List[Team]:
        """Get teams by competition ID"""
        sql = "SELECT * FROM teams WHERE competition_id = ?"
        result = self.client.execute(sql, [str(competition_id)])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_year(self, year: str) -> List[Team]:
        """Get teams by year"""
        # Use INSTR to avoid GLOB pattern issues with JSON array searching
        sql = "SELECT * FROM teams WHERE INSTR(years, ?) > 0"
        result = self.client.execute(sql, [year])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                team = self._row_to_team(row)
                if year in team.years:
                    teams.append(team)
        return teams
    
    def get_teams_by_status(self, status: str) -> List[Team]:
        """Get teams by status"""
        sql = "SELECT * FROM teams WHERE status = ?"
        result = self.client.execute(sql, [status])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_rank(self, rank: int) -> List[Team]:
        """Get teams by rank"""
        sql = "SELECT * FROM teams WHERE rank = ?"
        result = self.client.execute(sql, [rank])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_relation(self, relation: str) -> List[Team]:
        """Get teams by relation"""
        sql = "SELECT * FROM teams WHERE relation = ?"
        result = self.client.execute(sql, [relation])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_team_by_competition_id_and_name(self, competition_id: int, name: str) -> Optional[Team]:
        """Get team by competition ID and name"""
        sql = "SELECT * FROM teams WHERE competition_id = ? AND name = ? LIMIT 1"
        result = self.client.execute(sql, [str(competition_id), name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_team(result["results"][0])
        return None
    
    def get_teams_by_competition_id_and_year(self, competition_id: int, year: str) -> List[Team]:
        """Get teams by competition ID and year"""
        # Use INSTR to avoid GLOB pattern issues with JSON array searching
        sql = "SELECT * FROM teams WHERE competition_id = ? AND INSTR(years, ?) > 0"
        result = self.client.execute(sql, [str(competition_id), year])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                team = self._row_to_team(row)
                if year in team.years:
                    teams.append(team)
        return teams
    
    def get_teams_by_competition_id_and_status(self, competition_id: int, status: str) -> List[Team]:
        """Get teams by competition ID and status"""
        sql = "SELECT * FROM teams WHERE competition_id = ? AND status = ?"
        result = self.client.execute(sql, [str(competition_id), status])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_competition_id_and_rank(self, competition_id: int, rank: int) -> List[Team]:
        """Get teams by competition ID and rank"""
        sql = "SELECT * FROM teams WHERE competition_id = ? AND rank = ?"
        result = self.client.execute(sql, [str(competition_id), rank])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_teams_by_competition_id_and_relation(self, competition_id: int, relation: str) -> List[Team]:
        """Get teams by competition ID and relation"""
        sql = "SELECT * FROM teams WHERE competition_id = ? AND relation = ?"
        result = self.client.execute(sql, [str(competition_id), relation])
        
        teams = []
        if result.get("results"):
            for row in result["results"]:
                teams.append(self._row_to_team(row))
        return teams
    
    def get_team_by_name_and_year(self, name: str, year: str) -> Optional[Team]:
        """Get team by name and year"""
        # Use INSTR to avoid GLOB pattern issues with JSON array searching
        sql = "SELECT * FROM teams WHERE name = ? AND INSTR(years, ?) > 0 LIMIT 1"
        result = self.client.execute(sql, [name, year])
        
        if result.get("results") and len(result["results"]) > 0:
            team = self._row_to_team(result["results"][0])
            if year in team.years:
                return team
        return None
    
    def _row_to_team(self, row: dict) -> Team:
        """Convert database row to Team model"""
        tap_members_data = row.get("tap_members")
        if isinstance(tap_members_data, str):
            try:
                tap_members = [uuid.UUID(mid) for mid in json.loads(tap_members_data)]
            except:
                tap_members = None
        else:
            tap_members = tap_members_data
        
        members_list_data = row.get("members_list")
        if isinstance(members_list_data, str):
            try:
                members_list = json.loads(members_list_data)
            except:
                members_list = None
        else:
            members_list = members_list_data
        
        years_data = row.get("years")
        if isinstance(years_data, str):
            try:
                years = json.loads(years_data)
            except:
                years = []
        else:
            years = years_data if years_data else []
        
        return Team(
            id=uuid.UUID(row["id"]) if row.get("id") else None,
            name=row["name"],
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            description=row["description"],
            stage=row.get("stage"),
            institution_name=row.get("institution_name"),
            member_count=row.get("member_count"),
            tap_members=tap_members,
            members_list=members_list,
            leader=uuid.UUID(row["leader"]) if row.get("leader") else None,
            competition_id=int(row["competition_id"]),
            years=years,
            status=row.get("status"),
            rank=row.get("rank"),
            relation=row.get("relation"),
            intro_file_path=row.get("intro_file_path"),
            team_link=row.get("team_link")
        )
