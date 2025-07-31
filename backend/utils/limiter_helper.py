from slowapi.util import get_remote_address
from utils.limiter import limiter

def limit_all_routes(router, rate: str):
    for route in router.routes:
       
        print(route)
        if hasattr(route, "endpoint"):
            
            route.endpoint = limiter.limit(rate)(route.endpoint)
