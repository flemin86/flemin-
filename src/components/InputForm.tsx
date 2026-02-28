import React, { useState } from 'react';
import { Send, Loader2, Clock } from 'lucide-react';

interface InputFormProps {
  onSubmit: (prompt: string, duration: number) => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [input, setInput] = useState('');
  const [duration, setDuration] = useState(120);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input, duration);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
        <div className="relative bg-[#111] rounded-2xl p-4 flex flex-col gap-4 border border-white/10">
          
          {/* Text Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的短剧剧本、创意或小说片段... (例如：霸总短剧，女主重生复仇)"
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none resize-none min-h-[120px]"
            disabled={isLoading}
          />

          {/* Controls Bar */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">总时长(秒):</span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(10, parseInt(e.target.value) || 0))}
                  className="bg-transparent text-white w-16 text-center focus:outline-none font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  生成分镜
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      <p className="text-center text-gray-500 text-sm mt-4">
        AI 将自动拆解剧本，生成多组 10-15s 的高能分镜，突出短剧爽点。
      </p>
    </div>
  );
}
