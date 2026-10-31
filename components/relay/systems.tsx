"use client";
import { useState } from "react";
import {
  Box,
  Check,
  Network,
  Search,
  Server,
  TriangleAlert,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { PageTitle, SectionLabel } from "./primitives";
import { SystemMap, CircleIndicator } from "./system-map";
import { stateName } from "@/lib/relay";
export function SystemsView() {
  const { data } = useDashboard();
  const [query, setQuery] = useState("");
  const services = data?.services ?? [];
  const healthy = services.filter((s) => s.state === "healthy").length;
  const filtered = services.filter((s) =>
    `${s.name} ${s.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="r7-page">
      <PageTitle
        eyebrow="SYSTEMS / A CONNECTED PERSPECTIVE"
        title="Understand the connections."
        description="구성 요소의 상태를 읽고, 선언된 연결을 따라가 보세요."
        actions={
          <span className="r7-readonly-badge">
            <Network size={14} />
            Read-only observation
          </span>
        }
      />
      <div className="r7-system-summary">
        <div>
          <span className="r7-summary-symbol">
            <Box size={20} />
          </span>
          <strong>{services.length}</strong>
          <span>Services observed</span>
        </div>
        <div>
          <span className="r7-summary-symbol green">
            <Check size={20} />
          </span>
          <strong>{healthy}</strong>
          <span>Operational</span>
        </div>
        <div>
          <span className="r7-summary-symbol orange">
            <TriangleAlert size={20} />
          </span>
          <strong>{services.length - healthy}</strong>
          <span>Needs verification</span>
        </div>
        <div>
          <span className="r7-summary-symbol">
            <Network size={20} />
          </span>
          <strong>{data?.connections.length ?? 0}</strong>
          <span>Declared connections</span>
        </div>
      </div>
      <SystemMap expanded />
      <section className="r7-service-inventory">
        <div className="r7-runs-heading">
          <div>
            <SectionLabel>SERVICE INVENTORY</SectionLabel>
            <h2>Every component has a story.</h2>
          </div>
          <label className="r7-input-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="구성 요소 검색"
              aria-label="구성 요소 검색"
            />
          </label>
        </div>
        <div className="r7-inventory-grid">
          {filtered.map((s) => (
            <article key={s.id}>
              <div>
                <span className={`r7-service-status ${s.state}`}>
                  <CircleIndicator state={s.state} />
                  {stateName[s.state]}
                </span>
                <Server size={17} />
              </div>
              <h3>{s.name}</h3>
              <span>{s.role}</span>
              <p>{s.detail}</p>
              <dl>
                <div>
                  <dt>CPU</dt>
                  <dd>{s.cpu === undefined ? "—" : `${s.cpu}%`}</dd>
                </div>
                <div>
                  <dt>MEMORY</dt>
                  <dd>{s.memory === undefined ? "—" : `${s.memory}%`}</dd>
                </div>
                <div>
                  <dt>LATENCY</dt>
                  <dd>
                    {s.latencyMs === undefined ? "—" : `${s.latencyMs}ms`}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="r7-empty">
            <Search size={28} />
            <p>검색 조건에 맞는 구성 요소가 없습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
