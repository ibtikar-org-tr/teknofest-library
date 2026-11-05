from app.initializers.d1_client import d1_client
from app.models.resources import Resource
from typing import Optional, List
import json
import uuid
from datetime import datetime

class ResourceCRUD:
    """Cloudflare D1 implementation of ResourceCRUD"""
    
    def __init__(self):
        self.client = d1_client
    
    def get_resource(self, resource_id: int) -> Optional[Resource]:
        """Get a resource by ID"""
        sql = "SELECT * FROM resources WHERE id = ?"
        result = self.client.execute(sql, [str(resource_id)])
        
        if result.get("results") and len(result["results"]) > 0:
            return self._row_to_resource(result["results"][0])
        return None
    
    def get_resources(self, skip: int = 0, limit: int = 10) -> List[Resource]:
        """Get paginated list of resources"""
        sql = "SELECT * FROM resources LIMIT ? OFFSET ?"
        result = self.client.execute(sql, [limit, skip])
        
        resources = []
        if result.get("results"):
            for row in result["results"]:
                resources.append(self._row_to_resource(row))
        return resources
    
    def create_resource(self, resource: Resource) -> Resource:
        """Create a new resource"""
        resource_id = str(resource.id or uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        sql = """
        INSERT INTO resources (
            id, created_at, updated_at, deleted_at, competition_id, team_id,
            resource_type, resource_url, description, year, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = [
            resource_id, now, now, None,
            str(resource.competition_id), str(resource.team_id),
            resource.resource_type, resource.resource_url, resource.description, resource.year,
            json.dumps([str(cid) for cid in resource.comments]) if resource.comments else None
        ]
        
        self.client.execute(sql, params)
        resource.id = uuid.UUID(resource_id)
        return resource
    
    def update_resource(self, resource_id: int, resource: Resource) -> Optional[Resource]:
        """Update an existing resource"""
        db_resource = self.get_resource(resource_id)
        if db_resource is None:
            return None
        
        now = datetime.utcnow().isoformat()
        
        sql = """
        UPDATE resources SET
            updated_at = ?, competition_id = ?, team_id = ?,
            resource_type = ?, resource_url = ?, description = ?, year = ?, comments = ?
        WHERE id = ?
        """
        
        params = [
            now,
            str(resource.competition_id), str(resource.team_id),
            resource.resource_type, resource.resource_url, resource.description, resource.year,
            json.dumps([str(cid) for cid in resource.comments]) if resource.comments else None,
            str(resource_id)
        ]
        
        self.client.execute(sql, params)
        return self.get_resource(resource_id)
    
    def delete_resource(self, resource_id: int) -> Optional[Resource]:
        """Delete a resource"""
        db_resource = self.get_resource(resource_id)
        if db_resource is None:
            return None
        
        sql = "DELETE FROM resources WHERE id = ?"
        self.client.execute(sql, [str(resource_id)])
        return db_resource
    
    def get_resources_by_competition_id(self, competition_id: int) -> List[Resource]:
        """Get resources by competition ID"""
        sql = "SELECT * FROM resources WHERE competition_id = ?"
        result = self.client.execute(sql, [str(competition_id)])
        
        resources = []
        if result.get("results"):
            for row in result["results"]:
                resources.append(self._row_to_resource(row))
        return resources
    
    def get_resources_by_team_id(self, team_id: int) -> List[Resource]:
        """Get resources by team ID"""
        sql = "SELECT * FROM resources WHERE team_id = ?"
        result = self.client.execute(sql, [str(team_id)])
        
        resources = []
        if result.get("results"):
            for row in result["results"]:
                resources.append(self._row_to_resource(row))
        return resources
    
    def get_resources_by_resource_type(self, resource_type: str) -> List[Resource]:
        """Get resources by resource type"""
        sql = "SELECT * FROM resources WHERE resource_type = ?"
        result = self.client.execute(sql, [resource_type])
        
        resources = []
        if result.get("results"):
            for row in result["results"]:
                resources.append(self._row_to_resource(row))
        return resources
    
    def get_resources_by_year(self, year: int) -> List[Resource]:
        """Get resources by year"""
        sql = "SELECT * FROM resources WHERE year = ?"
        result = self.client.execute(sql, [year])
        
        resources = []
        if result.get("results"):
            for row in result["results"]:
                resources.append(self._row_to_resource(row))
        return resources
    
    def _row_to_resource(self, row: dict) -> Resource:
        """Convert database row to Resource model"""
        comments_data = row.get("comments")
        if isinstance(comments_data, str):
            try:
                comments = [uuid.UUID(cid) for cid in json.loads(comments_data)]
            except:
                comments = None
        else:
            comments = comments_data
        
        return Resource(
            id=uuid.UUID(row["id"]) if row.get("id") else None,
            created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row.get("updated_at") else datetime.utcnow(),
            deleted_at=datetime.fromisoformat(row["deleted_at"]) if row.get("deleted_at") else None,
            competition_id=uuid.UUID(row["competition_id"]),
            team_id=uuid.UUID(row["team_id"]),
            resource_type=row["resource_type"],
            resource_url=row["resource_url"],
            description=row["description"],
            year=row["year"],
            comments=comments
        )
