import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { ShotCard } from './components/ShotCard';
import { generateStoryboard, regenerateGroup } from './services/gemini';
import { StoryboardProject } from './types';
import { motion } from 'motion/react';
import { Film, Clock, Layers, Copy, Check, RefreshCw, Edit2 } from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<StoryboardProject | null>(null);
  const [promptInput, setPromptInput] = useState(''); // Store original prompt for regeneration
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  
  // State for regenerating specific groups
  const [regeneratingGroups, setRegeneratingGroups] = useState<Set<string>>(new Set());
  const [editingShotCount, setEditingShotCount] = useState<string | null>(null); // Group ID being edited
  const [tempShotCount, setTempShotCount] = useState<number>(0);

  const handleGenerate = async (prompt: string, duration: number) => {
    setIsLoading(true);
    setError(null);
    setPromptInput(prompt);
    try {
      const result = await generateStoryboard(prompt, duration);
      setProject(result);
    } catch (err) {
      console.error(err);
      setError("生成分镜时出现错误，请检查网络或 API Key 设置。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShotCountUpdate = async (groupId: string, summary: string, timeRange: string, newCount: number) => {
    if (!project) return;
    
    setEditingShotCount(null);
    setRegeneratingGroups(prev => new Set(prev).add(groupId));
    
    try {
      const result = await regenerateGroup(promptInput, summary, timeRange, newCount);
      
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          groups: prev.groups.map(g => {
            if (g.id === groupId) {
              return {
                ...g,
                shots: result.shots,
                seedancePrompt: result.seedancePrompt
              };
            }
            return g;
          })
        };
      });
    } catch (err) {
      console.error(err);
      alert("重生成失败，请重试");
    } finally {
      setRegeneratingGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string, groupId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGroup(groupId);
    setTimeout(() => setCopiedGroup(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[20vh]">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 tracking-tight">
            短剧分镜大师 <span className="text-indigo-500">2.0</span>
          </h2>
          <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center text-sm">
            {error}
          </div>
        )}

        {project && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-12"
          >
            {/* Project Header */}
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">{project.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>总时长: {project.totalDurationInput}s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>分段数: {project.groups.length}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = project.groups.map(g => 
                      `=== Group ${g.groupNumber} [${g.timeRange}] ===\n摘要: ${g.summary}\n\n${g.seedancePrompt}`
                    ).join('\n\n-------------------\n\n');
                    navigator.clipboard.writeText(text);
                    alert("完整分镜脚本已复制到剪贴板");
                  }}
                  className="text-sm bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-4 py-2 rounded-lg border border-indigo-500/20 transition-colors font-medium"
                >
                  复制完整脚本
                </button>
                <button 
                  onClick={() => setProject(null)}
                  className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2"
                >
                  清空
                </button>
              </div>
            </div>

            {/* Groups */}
            <div className="space-y-16">
              {project.groups.map((group) => (
                <div key={group.id} className="relative">
                  {/* Group Header */}
                  <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-sm py-4 mb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-md shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        Group {group.groupNumber}
                      </div>
                      <div className="font-mono text-indigo-400 text-sm">
                        {group.timeRange}
                      </div>
                      
                      {/* Shot Count Control */}
                      <div className="flex items-center gap-2 ml-4 bg-white/5 px-2 py-1 rounded border border-white/5">
                        <span className="text-xs text-gray-400 uppercase">镜头数:</span>
                        {editingShotCount === group.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tempShotCount}
                              onChange={(e) => setTempShotCount(parseInt(e.target.value) || 0)}
                              className="w-10 bg-black/50 text-white text-xs text-center border border-indigo-500 rounded focus:outline-none"
                              autoFocus
                              onBlur={() => {
                                if (tempShotCount !== group.shots.length) {
                                  handleShotCountUpdate(group.id, group.summary, group.timeRange, tempShotCount);
                                } else {
                                  setEditingShotCount(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleShotCountUpdate(group.id, group.summary, group.timeRange, tempShotCount);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setTempShotCount(group.shots.length);
                              setEditingShotCount(group.id);
                            }}
                            className="flex items-center gap-1 text-xs font-mono text-white hover:text-indigo-400 transition-colors"
                            title="点击修改镜头数量"
                          >
                            {group.shots.length}
                            <Edit2 className="w-3 h-3 opacity-50" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-right md:text-left md:pl-4 flex items-center justify-end md:justify-start gap-3">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">本段爽点:</span>
                      <span className="text-gray-200 font-medium italic truncate max-w-[300px]">"{group.summary}"</span>
                      {regeneratingGroups.has(group.id) && (
                        <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          重生成中...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shots Grid */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 transition-opacity duration-300 ${regeneratingGroups.has(group.id) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {group.shots.map((shot, index) => (
                      <ShotCard key={shot.id} shot={shot} index={index} />
                    ))}
                  </div>

                  {/* Seedance Prompt Box */}
                  <div className={`bg-[#111] border border-white/10 rounded-xl p-4 relative group/prompt transition-opacity duration-300 ${regeneratingGroups.has(group.id) ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="absolute top-4 right-4 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(group.seedancePrompt, group.id)}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                        title="复制提示词"
                      >
                        {copiedGroup === group.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Seedance Prompt</div>
                    <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {group.seedancePrompt}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
