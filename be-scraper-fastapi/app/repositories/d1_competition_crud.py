from app.initializers.d1_client import d1_client
from app.models.competition import Competition, CompetitionData, Report_File, Result_File
from typing import Optional, List
import json
import uuid
from datetime import datetime

class CompetitionCRUD:
    """Cloudflare D1 implementation of CompetitionCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_competition(self, competition_id: int) -> Optional[Competition]:
        """Get a competition by ID"""
        sql = "SELECT * FROM competitions WHERE id = ?"
        result = self.client.execute(sql, [str(competition_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competitions(self, skip: int = 0, limit: int = 10) -> List[Competition]:
        """Get paginated list of competitions"""
        sql = "SELECT * FROM competitions LIMIT ? OFFSET ?"
        result = self.client.execute(sql, [limit, skip])
        
        competitions = []
        if result.get("results"):
            for row in result["results"]:
                competitions.append(self._row_to_competition(row))
        return competitions
    
    def get_all_competitions(self, year: str) -> List[Competition]:
        """Get all competitions for a specific year"""
        # Use INSTR to avoid GLOB pattern issues with JSON array searching
        sql = "SELECT * FROM competitions WHERE INSTR(years, ?) > 0"
        result = self.client.execute(sql, [year])
        
        competitions = []
        if result.get("results"):
            for row in result["results"]:
                comp = self._row_to_competition(row)
                if year in comp.years:
                    competitions.append(comp)
        return competitions
    
    def create_competition(self, competition: Competition) -> Competition:
        """Create a new competition"""
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO competitions (
            id, created_at, updated_at, deleted_at, image_path, tk_number, t3kys_number,
            application_link_tr, application_link_en, application_link_ar,
            tr_name, tr_description, tr_link,
            en_name, en_description, en_link,
            ar_name, ar_description, ar_link,
            years, min_member, max_member
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            competition.id, now, now, None, competition.image_path,
            competition.tk_number, competition.t3kys_number,
            competition.application_link_tr, competition.application_link_en, competition.application_link_ar,
            competition.tr_name, competition.tr_description, competition.tr_link,
            competition.en_name, competition.en_description, competition.en_link,
            competition.ar_name, competition.ar_description, competition.ar_link,
            json.dumps(competition.years), competition.min_member, competition.max_member
        ]
        
        self.client.execute(sql, params)
        return competition
    
    def update_competition(self, competition_id: int, competition: Competition) -> Optional[Competition]:
        """Update an existing competition"""
        db_competition = self.get_competition(competition_id)
        if db_competition is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE competitions SET
            updated_at = ?, image_path = ?, tk_number = ?, t3kys_number = ?,
            application_link_tr = ?, application_link_en = ?, application_link_ar = ?,
            tr_name = ?, tr_description = ?, tr_link = ?,
            en_name = ?, en_description = ?, en_link = ?,
            ar_name = ?, ar_description = ?, ar_link = ?,
            years = ?, min_member = ?, max_member = ?
        WHERE id = ?
        """
        
        params = [
            now, competition.image_path,
            competition.tk_number, competition.t3kys_number,
            competition.application_link_tr, competition.application_link_en, competition.application_link_ar,
            competition.tr_name, competition.tr_description, competition.tr_link,
            competition.en_name, competition.en_description, competition.en_link,
            competition.ar_name, competition.ar_description, competition.ar_link,
            json.dumps(competition.years), competition.min_member, competition.max_member,
            str(competition_id)
        ]
        
        self.client.execute(sql, params)
        return self.get_competition(competition_id)
    
    def delete_competition(self, competition_id: int) -> Optional[Competition]:
        """Delete a competition"""
        db_competition = self.get_competition(competition_id)
        if db_competition is None:
            return None
        
        sql = "DELETE FROM competitions WHERE id = ?"
        self.client.execute(sql, [str(competition_id)])
        return db_competition
    
    def get_competition_by_tr_name(self, name: str) -> Optional[Competition]:
        """Get competition by Turkish name"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE tr_name = ? LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(LOWER(tr_name), LOWER(?)) > 0 LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_en_name(self, name: str) -> Optional[Competition]:
        """Get competition by English name"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE en_name = ? LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(LOWER(en_name), LOWER(?)) > 0 LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_ar_name(self, name: str) -> Optional[Competition]:
        """Get competition by Arabic name"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE ar_name = ? LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(LOWER(ar_name), LOWER(?)) > 0 LIMIT 1"
        result = self.client.execute(sql, [name])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competitions_by_year(self, year: str) -> List[Competition]:
        """Get competitions by year"""
        return self.get_all_competitions(year)
    
    def get_competition_by_tk_number(self, tk_number: str) -> Optional[Competition]:
        """Get competition by TK number"""
        sql = "SELECT * FROM competitions WHERE tk_number = ? LIMIT 1"
        result = self.client.execute(sql, [tk_number])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_t3kys_number(self, t3kys_number: str) -> Optional[Competition]:
        """Get competition by T3KYS number"""
        sql = "SELECT * FROM competitions WHERE t3kys_number = ? LIMIT 1"
        result = self.client.execute(sql, [t3kys_number])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_tr_link(self, tr_link: str) -> Optional[Competition]:
        """Get competition by Turkish link"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE tr_link = ? LIMIT 1"
        result = self.client.execute(sql, [tr_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(tr_link, ?) > 0 LIMIT 1"
        result = self.client.execute(sql, [tr_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_en_link(self, en_link: str) -> Optional[Competition]:
        """Get competition by English link"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE en_link = ? LIMIT 1"
        result = self.client.execute(sql, [en_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(en_link, ?) > 0 LIMIT 1"
        result = self.client.execute(sql, [en_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def get_competition_by_ar_link(self, ar_link: str) -> Optional[Competition]:
        """Get competition by Arabic link"""
        # Try exact match first
        sql = "SELECT * FROM competitions WHERE ar_link = ? LIMIT 1"
        result = self.client.execute(sql, [ar_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        
        # If exact match fails, try with INSTR for partial matching (avoids GLOB issues)
        sql = "SELECT * FROM competitions WHERE INSTR(ar_link, ?) > 0 LIMIT 1"
        result = self.client.execute(sql, [ar_link])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition(result["results"][0])
        return None
    
    def _row_to_competition(self, row: dict) -> Competition:
        """Convert database row to Competition model"""
        return Competition(
            id=int(row["id"]) if row.get("id") else None,
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            image_path=row.get("image_path", ""),
            tk_number=row.get("tk_number"),
            t3kys_number=row.get("t3kys_number"),
            application_link_tr=row.get("application_link_tr"),
            application_link_en=row.get("application_link_en"),
            application_link_ar=row.get("application_link_ar"),
            tr_name=row.get("tr_name"),
            tr_description=row.get("tr_description"),
            tr_link=row.get("tr_link"),
            en_name=row.get("en_name"),
            en_description=row.get("en_description"),
            en_link=row.get("en_link"),
            ar_name=row.get("ar_name"),
            ar_description=row.get("ar_description"),
            ar_link=row.get("ar_link"),
            years=json.loads(row.get("years", "[]")) if isinstance(row.get("years"), str) else row.get("years", []),
            min_member=row.get("min_member"),
            max_member=row.get("max_member")
        )

class CompetitionDataCRUD:
    """Cloudflare D1 implementation of CompetitionDataCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_competition_data(self, competition_id: int, year: str) -> Optional[CompetitionData]:
        """Get competition data by competition ID and year"""
        sql = "SELECT * FROM competition_data WHERE competition_id = ? AND year = ?"
        result = self.client.execute(sql, [str(competition_id), year])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_competition_data(result["results"][0])
        return None
    
    def create_competition_data(self, competition_data: CompetitionData) -> CompetitionData:
        """Create new competition data"""
        sql = """
        INSERT INTO competition_data (
            competition_id, year, created_at, updated_at, timeline, awards, criteria
        ) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?)
        """
        
        params = [
            str(competition_data.competition_id), competition_data.year,
            json.dumps(competition_data.timeline),
            json.dumps(competition_data.awards),
            json.dumps(competition_data.criteria)
        ]
        
        self.client.execute(sql, params)
        return competition_data
    
    def update_competition_data(self, competition_id: int, year: str, competition_data: CompetitionData) -> Optional[CompetitionData]:
        """Update existing competition data"""
        db_competition_data = self.get_competition_data(competition_id, year)
        if db_competition_data is None:
            return None
        
        sql = """
        UPDATE competition_data SET
            updated_at = CURRENT_TIMESTAMP, timeline = ?, awards = ?, criteria = ?
        WHERE competition_id = ? AND year = ?
        """
        
        params = [
            json.dumps(competition_data.timeline),
            json.dumps(competition_data.awards),
            json.dumps(competition_data.criteria),
            str(competition_id), competition_data.year
        ]
        
        self.client.execute(sql, params)
        return self.get_competition_data(competition_id, year)
    
    def _row_to_competition_data(self, row: dict) -> CompetitionData:
        """Convert database row to CompetitionData model"""
        return CompetitionData(
            competition_id=int(row["competition_id"]),
            year=row["year"],
            timeline=json.loads(row.get("timeline", "{}")) if isinstance(row.get("timeline"), str) else row.get("timeline", {}),
            awards=json.loads(row.get("awards", "{}")) if isinstance(row.get("awards"), str) else row.get("awards", {}),
            criteria=json.loads(row.get("criteria", "{}")) if isinstance(row.get("criteria"), str) else row.get("criteria", {})
        )

class ReportFileCRUD:
    """Cloudflare D1 implementation of ReportFileCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_report_file(self, report_file_id: uuid.UUID) -> Optional[Report_File]:
        """Get a report file by ID"""
        sql = "SELECT * FROM report_files WHERE id = ?"
        result = self.client.execute(sql, [str(report_file_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_report_file(result["results"][0])
        return None
    
    def get_report_files(self, skip: int = 0, limit: int = 10) -> List[Report_File]:
        """Get paginated list of report files"""
        sql = "SELECT * FROM report_files LIMIT ? OFFSET ?"
        result = self.client.execute(sql, [limit, skip])
        
        report_files = []
        if result.get("results"):
            for row in result["results"]:
                report_files.append(self._row_to_report_file(row))
        return report_files
    
    def create_report_file(self, report_file: Report_File) -> Report_File:
        """Create a new report file"""
        file_id = str(report_file.id or uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO report_files (
            id, created_at, updated_at, deleted_at, competition_id, team_id,
            year, file_path, rank, stage, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            file_id, now, now, None,
            str(report_file.competition_id), str(report_file.team_id) if report_file.team_id else None,
            report_file.year, report_file.file_path,
            report_file.rank, report_file.stage, report_file.language
        ]
        
        self.client.execute(sql, params)
        report_file.id = uuid.UUID(file_id)
        return report_file
    
    def update_report_file(self, report_file_id: uuid.UUID, report_file: Report_File) -> Optional[Report_File]:
        """Update an existing report file"""
        db_report_file = self.get_report_file(report_file_id)
        if db_report_file is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE report_files SET
            updated_at = ?, competition_id = ?, team_id = ?,
            year = ?, file_path = ?, rank = ?, stage = ?, language = ?
        WHERE id = ?
        """
        
        params = [
            now,
            str(report_file.competition_id), str(report_file.team_id) if report_file.team_id else None,
            report_file.year, report_file.file_path,
            report_file.rank, report_file.stage, report_file.language,
            str(report_file_id)
        ]
        
        self.client.execute(sql, params)
        return self.get_report_file(report_file_id)
    
    def delete_report_file(self, report_file_id: uuid.UUID) -> Optional[Report_File]:
        """Delete a report file"""
        db_report_file = self.get_report_file(report_file_id)
        if db_report_file is None:
            return None
        
        sql = "DELETE FROM report_files WHERE id = ?"
        self.client.execute(sql, [str(report_file_id)])
        return db_report_file
    
    def get_report_files_by_competition_id_and_team_id(self, competition_id: int, team_id: int) -> List[Report_File]:
        """Get report files by competition ID and team ID"""
        sql = "SELECT * FROM report_files WHERE competition_id = ? AND team_id = ?"
        result = self.client.execute(sql, [str(competition_id), str(team_id)])
        
        report_files = []
        if result.get("results"):
            for row in result["results"]:
                report_files.append(self._row_to_report_file(row))
        return report_files
    
    def _row_to_report_file(self, row: dict) -> Report_File:
        """Convert database row to Report_File model"""
        return Report_File(
            id=uuid.UUID(row["id"]) if row.get("id") else None,
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            competition_id=int(row["competition_id"]),
            team_id=uuid.UUID(row["team_id"]) if row.get("team_id") else None,
            year=row["year"],
            file_path=row["file_path"],
            rank=row.get("rank"),
            stage=row.get("stage"),
            language=row.get("language")
        )


class ResultFileCRUD:
    """Cloudflare D1 implementation of ResultFileCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_result_file(self, result_file_id: int) -> Optional[Result_File]:
        """Get a result file by ID"""
        sql = "SELECT * FROM result_files WHERE id = ?"
        result = self.client.execute(sql, [str(result_file_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_result_file(result["results"][0])
        return None
    
    def get_result_files(self, skip: int = 0, limit: int = 10) -> List[Result_File]:
        """Get paginated list of result files"""
        sql = "SELECT * FROM result_files LIMIT ? OFFSET ?"
        result = self.client.execute(sql, [limit, skip])
        
        result_files = []
        if result.get("results"):
            for row in result["results"]:
                result_files.append(self._row_to_result_file(row))
        return result_files
    
    def create_result_file(self, result_file: Result_File) -> Result_File:
        """Create a new result file"""
        file_id = str(result_file.id or uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO result_files (
            id, created_at, updated_at, deleted_at, competition_id,
            year, stage, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            file_id, now, now, None,
            str(result_file.competition_id),
            result_file.year, result_file.stage, result_file.file_path
        ]
        
        self.client.execute(sql, params)
        result_file.id = uuid.UUID(file_id)
        return result_file
    
    def update_result_file(self, result_file_id: int, result_file: Result_File) -> Optional[Result_File]:
        """Update an existing result file"""
        db_result_file = self.get_result_file(result_file_id)
        if db_result_file is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE result_files SET
            updated_at = ?, competition_id = ?,
            year = ?, stage = ?, file_path = ?
        WHERE id = ?
        """
        
        params = [
            now,
            str(result_file.competition_id),
            result_file.year, result_file.stage, result_file.file_path,
            str(result_file_id)
        ]
        
        self.client.execute(sql, params)
        return self.get_result_file(result_file_id)
    
    def delete_result_file(self, result_file_id: int) -> Optional[Result_File]:
        """Delete a result file"""
        db_result_file = self.get_result_file(result_file_id)
        if db_result_file is None:
            return None
        
        sql = "DELETE FROM result_files WHERE id = ?"
        self.client.execute(sql, [str(result_file_id)])
        return db_result_file
    
    def _row_to_result_file(self, row: dict) -> Result_File:
        """Convert database row to Result_File model"""
        return Result_File(
            id=uuid.UUID(row["id"]) if row.get("id") else None,
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            competition_id=int(row["competition_id"]),
            year=row["year"],
            stage=row["stage"],
            file_path=row["file_path"]
        )
