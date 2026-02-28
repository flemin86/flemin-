import React from 'react';
import { Shot } from '../types';
import { Video, Mic, Move, ArrowRightLeft, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

interface ShotCardProps {
  shot: Shot;
  index: number;
}

export function ShotCard({ shot, index }: ShotCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors group"
    >
      {/* Header */}
      <div className="bg-[#111] px-4 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-indigo-500/50 font-mono">
            {String(shot.shotNumber).padStart(2, '0')}
          </span>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">
            {shot.duration}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
          <ArrowRightLeft className="w-3 h-3" />
          {shot.transition}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Visual */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-semibold">
            <Video className="w-3 h-3" /> 画面描述
          </div>
          <p className="text-gray-200 leading-relaxed text-sm">
            {shot.visualDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Movement */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider">
              <Move className="w-3 h-3" /> 运镜
            </div>
            <p className="text-indigo-300 text-sm font-medium">
              {shot.cameraMovement}
            </p>
          </div>

          {/* Audio */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider">
              <Mic className="w-3 h-3" /> 声音
            </div>
            <p className="text-emerald-300 text-sm font-medium">
              {shot.audio}
            </p>
          </div>
        </div>

        {/* Reasoning / Director's Note */}
        <div className="pt-4 mt-2 border-t border-white/5">
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 italic">
              <span className="text-amber-500/70 font-semibold not-italic mr-1">导演批注:</span>
              {shot.reasoning}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
