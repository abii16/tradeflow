import heapq
import math


class Node:
    def __init__(self, id: str, name: str, lat: float, lng: float):
        self.id = id
        self.name = name
        self.lat = lat
        self.lng = lng


class Edge:
    def __init__(
        self, start_id: str, end_id: str, distance_km: float, base_time_hours: float
    ):
        self.start_id = start_id
        self.end_id = end_id
        self.distance_km = distance_km
        self.base_time_hours = base_time_hours
        self.fuel_availability = 1.0  # 0.0 to 1.0 (1.0 = fully available)
        self.road_condition = 1.0  # Multiplier: 1.0 = normal, >1.0 = bad
        self.security_risk = 0.0  # 0.0 = safe, 1.0 = high risk (conflict zone)


class RoutingEngine:
    def __init__(self):
        self.nodes = {}
        self.edges = {}
        self._initialize_graph()

    def _initialize_graph(self):
        # Add nodes
        hubs = [
            ("DJI", "Djibouti Port", 11.6082, 43.1497),
            ("SEM", "Semera", 11.7944, 41.0105),
            ("MEK", "Mekelle", 13.4967, 39.4753),
            ("DIR", "Dire Dawa", 9.6009, 41.8501),
            ("MOD", "Modjo Dry Port", 8.5878, 39.1171),
            ("ADA", "Adama", 8.5416, 39.2688),
            ("ADD", "Addis Ababa", 9.0320, 38.7483),
            ("HAW", "Hawassa", 7.0504, 38.4768),
            ("KOM", "Kombolcha", 11.0833, 39.7333),
        ]
        for id, name, lat, lng in hubs:
            self.nodes[id] = Node(id, name, lat, lng)

        # Add edges (undirected, so add both ways)
        connections = [
            ("DJI", "SEM", 370, 7.0),
            ("SEM", "MEK", 420, 8.5),
            ("SEM", "MOD", 520, 9.5),
            ("DJI", "DIR", 320, 6.0),
            ("DIR", "MOD", 440, 8.0),
            ("MOD", "ADA", 30, 0.5),
            ("ADA", "ADD", 90, 1.5),
            ("MOD", "ADD", 75, 1.5),
            ("ADD", "KOM", 375, 7.5),
            ("KOM", "MEK", 390, 8.0),
            ("MOD", "HAW", 200, 3.5),
            ("ADD", "HAW", 275, 4.5),
        ]

        for u, v, dist, time in connections:
            if u not in self.edges:
                self.edges[u] = []
            if v not in self.edges:
                self.edges[v] = []
            self.edges[u].append(Edge(u, v, dist, time))
            self.edges[v].append(Edge(v, u, dist, time))

    def _find_nearest_node(self, lat: float, lng: float) -> str:
        best_node = None
        min_dist = float("inf")
        for node in self.nodes.values():
            dist = math.hypot(node.lat - lat, node.lng - lng)
            if dist < min_dist:
                min_dist = dist
                best_node = node.id
        return best_node

    def update_incident(
        self, lat: float, lng: float, incident_type: str, severity: str
    ):
        # find nearest edge and update its cost
        nearest_u, nearest_v = None, None
        min_dist = float("inf")

        for u in self.edges:
            for edge in self.edges[u]:
                node_u, node_v = self.nodes[u], self.nodes[edge.end_id]
                mid_lat = (node_u.lat + node_v.lat) / 2
                mid_lng = (node_u.lng + node_v.lng) / 2
                dist = math.hypot(mid_lat - lat, mid_lng - lng)
                if dist < min_dist:
                    min_dist = dist
                    nearest_u, nearest_v = u, edge.end_id

        # Apply penalty
        if nearest_u and nearest_v:
            for edge in self.edges[nearest_u]:
                if edge.end_id == nearest_v:
                    self._apply_penalty(edge, incident_type, severity)
            for edge in self.edges[nearest_v]:
                if edge.end_id == nearest_u:
                    self._apply_penalty(edge, incident_type, severity)

            return (
                True,
                f"Incident updated between {self.nodes[nearest_u].name} and {self.nodes[nearest_v].name}",
            )
        return False, "No nearby route found to apply incident"

    def _apply_penalty(self, edge: Edge, incident_type: str, severity: str):
        if incident_type == "conflict":
            edge.security_risk = min(
                1.0, edge.security_risk + (0.5 if severity == "high" else 0.2)
            )
        elif incident_type == "road_closure" or incident_type == "accident":
            edge.road_condition += 2.0 if severity == "high" else 0.5
        elif incident_type == "fuel_shortage":
            edge.fuel_availability = max(
                0.0, edge.fuel_availability - (0.5 if severity == "high" else 0.2)
            )

    def get_optimal_route(
        self,
        start_lat: float,
        start_lng: float,
        dest_lat: float,
        dest_lng: float,
        vehicle_weight: float,
        fuel_level: float,
    ):
        start_node = self._find_nearest_node(start_lat, start_lng)
        end_node = self._find_nearest_node(dest_lat, dest_lng)

        if not start_node or not end_node:
            return {"path": [], "total_distance": 0, "total_time": 0, "savings": 0}

        if start_node == end_node:
            return {
                "path": [self.nodes[start_node].name],
                "total_distance": 0,
                "total_time": 0,
                "savings": 0,
            }

        pq = [(0, start_node, [self.nodes[start_node].name], 0.0, 0.0)]
        visited = set()

        while pq:
            cost, current, path, dist, time = heapq.heappop(pq)

            if current == end_node:
                return {
                    "path": path,
                    "total_distance": dist,
                    "total_time": time,
                    "savings": max(2.5, round(15.0 - (cost / 100.0), 2)),
                }

            if current in visited:
                continue
            visited.add(current)

            for edge in self.edges.get(current, []):
                if edge.end_id not in visited:
                    w_dist = 1.0
                    w_time = 1.5
                    w_fuel = 2.0 if fuel_level < 30.0 else 0.5
                    w_risk = 5.0

                    edge_cost = (edge.distance_km * w_dist) + (
                        edge.base_time_hours * edge.road_condition * w_time
                    )

                    if edge.fuel_availability < 0.5 and fuel_level < 30.0:
                        edge_cost += 100 * w_fuel

                    edge_cost += edge.security_risk * 200 * w_risk

                    heapq.heappush(
                        pq,
                        (
                            cost + edge_cost,
                            edge.end_id,
                            path + [self.nodes[edge.end_id].name],
                            dist + edge.distance_km,
                            time + (edge.base_time_hours * edge.road_condition),
                        ),
                    )

        return {"path": [], "total_distance": 0, "total_time": 0, "savings": 0}


routing_engine = RoutingEngine()
