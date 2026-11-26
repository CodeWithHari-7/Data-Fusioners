export interface Case {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  source_count: number;
  claim_count: number;
  conflict_count: number;
  anomaly_count: number;
}

export interface Source {
  id: string;
  case_id: string;
  filename: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  status: string;
  error_message?: string;
  metadata_json?: string;
  created_at: string;
}

export interface Claim {
  id: string;
  case_id: string;
  source_id: string;
  source_filename?: string;
  entity: string;
  attribute: string;
  value?: number;
  raw_value: string;
  unit?: string;
  normalized_value?: number;
  normalized_unit?: string;
  timestamp?: string;
  page_number?: number;
  row_number?: number;
  original_text: string;
  extraction_method: string;
  extraction_confidence: number;
  created_at: string;
}

export interface Conflict {
  id: string;
  case_id: string;
  entity: string;
  attribute: string;
  conflict_type: string;
  severity: "high" | "medium" | "low" | "corroborated";
  status: "detected" | "under_review" | "resolved" | "dismissed";
  explanation: string;
  tolerance_applied: number;
  value_a_normalized?: number;
  value_b_normalized?: number;
  unit_normalized?: string;
  claim_a: Claim;
  claim_b: Claim;
  created_at: string;
}

export interface Anomaly {
  id: string;
  case_id: string;
  claim_id: string;
  entity: string;
  attribute: string;
  z_score: number;
  mean_value: number;
  std_dev: number;
  claim_value: number;
  unit?: string;
  explanation: string;
  status: string;
  claim: Claim;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "CASE" | "SOURCE" | "ENTITY" | "CLAIM";
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  entity: string;
  attribute: string;
  value?: number;
  raw_value: string;
  unit?: string;
  normalized_value?: number;
  normalized_unit?: string;
  source_filename: string;
  page_number?: number;
  row_number?: number;
  original_text: string;
  confidence: number;
  status: "normal" | "conflict" | "corroborated";
}

export interface Review {
  id: string;
  case_id: string;
  target_type: string;
  target_id: string;
  resolution: string;
  analyst_note?: string;
  analyst_id: string;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  database: string;
  circuit_breaker: {
    ocr: { service: string; state: string; failure_count: number };
    embedding: { service: string; state: string; failure_count: number };
  };
  active_jobs: number;
  dlq_count: number;
}
