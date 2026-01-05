import httpx
from app.initializers import env
from typing import Optional, Any, Dict, List
import json

class D1Client:
    """Cloudflare D1 Database API Client"""
    
    def __init__(self):
        self.account_id = env.CLOUDFLARE_ACCOUNT_ID
        self.database_id = env.CLOUDFLARE_D1_DATABASE_ID
        self.api_token = env.CLOUDFLARE_API_TOKEN
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/d1/database/{self.database_id}"
        
        if not all([self.account_id, self.database_id, self.api_token]):
            raise ValueError("Missing Cloudflare D1 configuration. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in your .env file.")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    async def execute(self, sql: str, params: Optional[List[Any]] = None) -> Dict[str, Any]:
        """
        Execute a SQL query against D1 database
        
        Args:
            sql: SQL query string
            params: Optional list of parameters for prepared statements
            
        Returns:
            Dict containing query results
        """
        url = f"{self.base_url}/query"
        
        payload = {
            "sql": sql
        }
        
        if params:
            payload["params"] = params
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"D1 API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            if not result.get("success", False):
                errors = result.get("errors", [])
                raise Exception(f"D1 Query Failed: {errors}")
            
            return result.get("result", [{}])[0] if result.get("result") else {}
    
    async def execute_batch(self, queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute multiple SQL queries in a batch
        
        Args:
            queries: List of query dicts with 'sql' and optional 'params' keys
            
        Returns:
            List of query results
        """
        url = f"{self.base_url}/query"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=queries
            )
            
            if response.status_code != 200:
                raise Exception(f"D1 API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            if not result.get("success", False):
                errors = result.get("errors", [])
                raise Exception(f"D1 Batch Query Failed: {errors}")
            
            return result.get("result", [])

# Global D1 client instance
d1_client = D1Client()
