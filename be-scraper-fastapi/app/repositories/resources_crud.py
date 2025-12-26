from sqlalchemy.orm import Session
from app.models.resources import Resource

class ResourceCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_resource(self, resource_id: int):
        return self.db.query(Resource).filter(Resource.id == resource_id).first()
    
    def get_resources(self, skip: int = 0, limit: int = 10):
        return self.db.query(Resource).offset(skip).limit(limit).all()
    
    def create_resource(self, resource: Resource):
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource
    
    def update_resource(self, resource_id: int, resource: Resource):
        db_resource = self.get_resource(resource_id)
        if db_resource is None:
            return None
        for key, value in resource.dict().items():
            setattr(db_resource, key, value)
        self.db.commit()
        self.db.refresh(db_resource)
        return db_resource
    
    def delete_resource(self, resource_id: int):
        db_resource = self.get_resource(resource_id)
        if db_resource is None:
            return None
        self.db.delete(db_resource)
        self.db.commit()
        return db_resource
    
    def get_resources_by_competition_id(self, competition_id: int):
        return self.db.query(Resource).filter(Resource.competition_id == competition_id).all()
    
    def get_resources_by_team_id(self, team_id: int):
        return self.db.query(Resource).filter(Resource.team_id == team_id).all()
    
    def get_resources_by_resource_type(self, resource_type: str):
        return self.db.query(Resource).filter(Resource.resource_type == resource_type).all()
    
    def get_resources_by_year(self, year: int):
        return self.db.query(Resource).filter(Resource.year == year).all()
            