"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA, Project } from "@/lib/portfolioData";
import { ProjectSchematicModal } from "./ProjectSchematicModal";

export const ProjectsSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleOpenSchematic = (project: Project) => {
    soundEngine.playCyberBlip(1100);
    setSelectedProject(project);
  };

  return (
    <section id="projects" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
          <FolderGit2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-green tracking-widest font-semibold flex items-center gap-1.5">
            <span>{"[03 // MISSION LOGS]"}</span>
            <span className="text-white/30">•</span>
            <span>ENGINEERING SHOWCASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            SELECTED SECURITY PROJECTS
          </h2>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PORTFOLIO_DATA.projects.map((project, idx) => (
          <div
            key={project.id}
            className="cyber-card p-6 rounded-xl border border-cyber-border hover:border-neon-cyan/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Module Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neon-green tracking-widest uppercase">
                  {`MODULE_00${idx + 1} // ${project.category}`}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyber-dark border border-white/10 text-neon-cyan">
                  PRODUCTION READY
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-neon-cyan/80 mt-0.5 font-medium">{project.subtitle}</p>
                <p className="text-xs text-cyber-textLight mt-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyber-dark border border-white/5 text-cyber-textMuted group-hover:text-cyber-textLight transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 bg-cyber-dark/40 rounded p-2">
                {project.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <div className="text-xs font-bold text-neon-green">{m.value}</div>
                    <div className="text-[9px] text-cyber-textMuted truncate">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleOpenSchematic(project)}
                className="text-xs text-neon-cyan hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
              >
                <Layers className="w-3.5 h-3.5 text-neon-cyan" />
                <span>VIEW ARCHITECTURAL SCHEMATIC</span>
              </button>

              <div className="flex items-center gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => soundEngine.playCyberBlip(800)}
                    className="p-1.5 rounded bg-cyber-dark border border-cyber-border text-cyber-textMuted hover:text-white transition-colors"
                    title="GitHub Repository"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target={project.liveUrl.startsWith("#") ? "_self" : "_blank"}
                    rel="noreferrer"
                    onClick={() => soundEngine.playCyberBlip(1000)}
                    className="px-2.5 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green hover:text-cyber-black text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>LIVE DEMO</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schematic Viewer Modal */}
      <ProjectSchematicModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
};
