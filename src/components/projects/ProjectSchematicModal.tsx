"use client";

import React from "react";
import {
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  X,
  Server,
  Lock,
  Cpu,
  Database,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Project } from "@/lib/portfolioData";

interface ProjectSchematicModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectSchematicModal: React.FC<ProjectSchematicModalProps> = ({
  project,
  onClose,
}) => {
  if (!project) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "ingress": return <Server className="w-4 h-4 text-neon-cyan" />;
      case "engine": return <Cpu className="w-4 h-4 text-neon-green" />;
      case "security": return <Lock className="w-4 h-4 text-neon-amber" />;
      case "storage": return <Database className="w-4 h-4 text-neon-purple" />;
      default: return <Layers className="w-4 h-4 text-neon-green" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-3xl bg-cyber-dark border border-neon-cyan/50 rounded-xl shadow-glowCyan overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyber-dark border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neon-cyan font-bold tracking-widest uppercase">
                ARCHITECTURAL SCHEMATIC // {project.category}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">{project.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-cyber-textMuted hover:text-white p-1.5 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Schematic Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-cyber-textLight">
          {/* Executive Overview */}
          <div className="bg-cyber-card p-4 rounded-lg border border-white/5 space-y-2">
            <div className="text-white font-bold text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-neon-green" />
              <span>SECURITY ARCHITECTURE &amp; GOVERNANCE:</span>
            </div>
            <p className="leading-relaxed text-cyber-textLight">{project.description}</p>
          </div>

          {/* Node Topology Schematic */}
          <div>
            <div className="text-neon-cyan font-bold text-xs uppercase tracking-wider mb-3">
              SYSTEM TOPOLOGY &amp; NODE PIPELINE:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {project.architecture.nodes.map((node, index) => (
                <div
                  key={node.id}
                  className="p-3 bg-cyber-card rounded-lg border border-cyber-border flex flex-col justify-between space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyber-textMuted font-mono">NODE_0{index + 1}</span>
                    {getNodeIcon(node.type)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{node.label}</div>
                    <div className="text-[10px] text-cyber-textMuted mt-0.5">{node.role}</div>
                  </div>
                  <div className="pt-1 text-[9px] uppercase tracking-wider text-neon-green">
                    STATUS: ACTIVE
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Flow Trace */}
          <div className="bg-cyber-card p-4 rounded-lg border border-white/5 space-y-3">
            <div className="text-neon-green font-bold text-xs flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-neon-green" />
              <span>STEP-BY-STEP DATA FLOW &amp; EXECUTION:</span>
            </div>
            <div className="space-y-2 font-mono">
              {project.architecture.dataFlow.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                  <span className="w-5 h-5 rounded bg-cyber-dark border border-neon-green/30 text-neon-green flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-cyber-textLight leading-tight pt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance & Security Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {project.metrics.map((m) => (
              <div key={m.label} className="p-3 bg-cyber-card rounded-lg border border-cyber-border text-center">
                <div className="text-lg font-bold text-neon-green font-mono">{m.value}</div>
                <div className="text-[10px] text-cyber-textMuted mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-cyber-border bg-cyber-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-cyber-dark border border-cyber-border text-white text-xs hover:border-white transition-colors flex items-center gap-1.5"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GITHUB REPO</span>
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target={project.liveUrl.startsWith("#") ? "_self" : "_blank"}
                rel="noreferrer"
                onClick={() => {
                  if (project.liveUrl.startsWith("#")) {
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded bg-neon-green text-cyber-black font-bold text-xs hover:bg-neon-cyan transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>LIVE DEMO / ACTION</span>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs text-cyber-textMuted hover:text-white px-3 py-1.5"
          >
            CLOSE SCHEMATIC
          </button>
        </div>
      </div>
    </div>
  );
};
