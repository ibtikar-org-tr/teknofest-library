from sqlalchemy.orm import Session
from app.models.competition import Competition, Report_File, Result_File
from app.initializers.db import engine

class CompetitionCRUD:
    def __init__(self):
        self.db = Session(engine)

    def get_competition(self, competition_id: int):
        return self.db.query(Competition).filter(Competition.id == competition_id).first()

    def get_competitions(self, skip: int = 0, limit: int = 10):
        return self.db.query(Competition).offset(skip).limit(limit).all()
    
    def get_all_competitions(self, year: str):
        return self.db.query(Competition).filter(Competition.year == year).all()

    def create_competition(self, competition: Competition):
        self.db.add(competition)
        self.db.commit()
        self.db.refresh(competition)
        return competition

    def update_competition(self, competition_id: int, competition: Competition):
        db_competition = self.get_competition(competition_id)
        if db_competition is None:
            return None
        for key, value in competition.dict().items():
            setattr(db_competition, key, value)
        self.db.commit()
        self.db.refresh(db_competition)
        return db_competition

    def delete_competition(self, competition_id: int):
        db_competition = self.get_competition(competition_id)
        if db_competition is None:
            return None
        self.db.delete(db_competition)
        self.db.commit()
        return db_competition
    
    def get_competition_by_tr_name(self, name: str):
        return self.db.query(Competition).filter(Competition.tr_name.contains(name)).first()
    
    def get_competition_by_en_name(self, name: str):
        return self.db.query(Competition).filter(Competition.en_name.contains(name)).first()
    
    def get_competition_by_ar_name(self, name: str):
        return self.db.query(Competition).filter(Competition.ar_name.contains(name)).first()
    
    def get_competitions_by_year(self, year: str):
        return self.db.query(Competition).filter(Competition.years.contains(year)).all()
    
    def get_competition_by_tk_number(self, tk_number: str):
        return self.db.query(Competition).filter(Competition.tk_number == tk_number).first()
    
    def get_competition_by_t3kys_number(self, t3kys_number: str):
        return self.db.query(Competition).filter(Competition.t3kys_number == t3kys_number).first()
    
    def get_competition_by_tr_link(self, tr_link: str):
        return self.db.query(Competition).filter(Competition.tr_link.contains(tr_link)).first()
    
    def get_competition_by_en_link(self, en_link: str):
        return self.db.query(Competition).filter(Competition.en_link.contains(en_link)).first()
    
    def get_competition_by_ar_link(self, ar_link: str):
        return self.db.query(Competition).filter(Competition.ar_link.contains(ar_link)).first()

class ReportFileCRUD:
    def __init__(self):
        self.db = Session(engine)

    def get_report_file(self, report_file_id: int):
        return self.db.query(Report_File).filter(Report_File.id == report_file_id).first()
    
    def get_report_files(self, skip: int = 0, limit: int = 10):
        return self.db.query(Report_File).offset(skip).limit(limit).all()
    
    def create_report_file(self, report_file: Report_File):
        self.db.add(report_file)
        self.db.commit()
        self.db.refresh(report_file)
        return report_file
    
    def update_report_file(self, report_file_id: int, report_file: Report_File):
        db_report_file = self.get_report_file(report_file_id)
        if db_report_file is None:
            return None
        for key, value in report_file.dict().items():
            setattr(db_report_file, key, value)
        self.db.commit()
        self.db.refresh(db_report_file)
        return db_report_file
    
    def delete_report_file(self, report_file_id: int):
        db_report_file = self.get_report_file(report_file_id)
        if db_report_file is None:
            return None
        self.db.delete(db_report_file)
        self.db.commit()
        return db_report_file
    
    def get_report_files_by_competition_id_and_team_id(self, competition_id: int, team_id: int):
        return self.db.query(Report_File).filter(Report_File.competition_id == competition_id, Report_File.team_id == team_id).all()
    
class ResultFileCRUD:
    def __init__(self, db: Session):
        self.db = Session(engine)
    
    def get_result_file(self, result_file_id: int):
        return self.db.query(Result_File).filter(Result_File.id == result_file_id).first()
    
    def get_result_files(self, skip: int = 0, limit: int = 10):
        return self.db.query(Result_File).offset(skip).limit(limit).all()
    
    def create_result_file(self, result_file: Result_File):
        self.db.add(result_file)
        self.db.commit()
        self.db.refresh(result_file)
        return result_file
    
    def update_result_file(self, result_file_id: int, result_file: Result_File):
        db_result_file = self.get_result_file(result_file_id)
        if db_result_file is None:
            return None
        for key, value in result_file.dict().items():
            setattr(db_result_file, key, value)
        self.db.commit()
        self.db.refresh(db_result_file)
        return db_result_file
    
    def delete_result_file(self, result_file_id: int):
        db_result_file = self.get_result_file(result_file_id)
        if db_result_file is None:
            return None
        self.db.delete(db_result_file)
        self.db.commit()
        return db_result_file
    
