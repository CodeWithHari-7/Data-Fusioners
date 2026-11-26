import numpy as np
from typing import List, Dict, Any, Optional
from app.config import settings

class AnomalyDetector:
    """
    Statistical outlier detection using Z-score and interquartile deviation.
    CRITICAL: Outliers are flagged for analyst inspection, NOT treated as automatic proof of defect.
    """
    def __init__(self, z_threshold: float = settings.ANOMALY_ZSCORE_THRESHOLD):
        self.z_threshold = z_threshold

    def detect_anomalies(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Group claims by (entity, attribute) and detect statistical outliers.
        """
        groups: Dict[tuple, List[Dict[str, Any]]] = {}
        for c in claims:
            # Only consider claims with valid normalized numerical values
            val = c.get("normalized_value")
            if val is not None:
                key = (c["entity"].strip().lower(), c["attribute"].strip().lower())
                groups.setdefault(key, []).append(c)

        anomalies: List[Dict[str, Any]] = []

        for (ent, attr), group_claims in groups.items():
            if len(group_claims) < 3:
                # Need at least 3 points for meaningful variance
                continue

            values = np.array([c["normalized_value"] for c in group_claims], dtype=np.float64)
            mean = float(np.mean(values))
            std = float(np.std(values))

            if std < 1e-5:
                # All values virtually identical; no outliers
                continue

            for c in group_claims:
                val = c["normalized_value"]
                z = (val - mean) / std
                if abs(z) >= self.z_threshold:
                    anomalies.append({
                        "case_id": c.get("case_id"),
                        "claim_id": c.get("id"),
                        "entity": c.get("entity"),
                        "attribute": c.get("attribute"),
                        "claim_value": c.get("value"),
                        "unit": c.get("unit"),
                        "z_score": round(float(z), 2),
                        "mean_value": round(mean, 2),
                        "std_dev": round(std, 2),
                        "explanation": (
                            f"Statistical outlier flag: Value {c.get('value')} {c.get('unit')} deviates by "
                            f"{abs(z):.2f} standard deviations from group mean ({mean:.2f}). "
                            f"Note: This is an empirical outlier flag, not automatic proof of error."
                        ),
                        "status": "flagged"
                    })

        return anomalies

anomaly_detector = AnomalyDetector()
