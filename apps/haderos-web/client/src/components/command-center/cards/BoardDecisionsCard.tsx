import { Vote, Clock, AlertCircle, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PendingVote {
  id: string;
  title: string;
  description: string;
  timeRemaining: string;
  votesFor: number;
  totalVotes: number;
}

interface BoardDecisionsData {
  pendingCount: number;
  currentVote: PendingVote;
}

export function BoardDecisionsCard() {
  const data: BoardDecisionsData = {
    pendingCount: 1,
    currentVote: {
      id: '1',
      title: 'Budget Approval',
      description: 'Proposal to increase marketing budget by 20% (SAR 500K) for Q2 2026',
      timeRemaining: '2h 15m',
      votesFor: 5,
      totalVotes: 7,
    },
  };

  const voteProgress = (data.currentVote.votesFor / data.currentVote.totalVotes) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-yellow-500/20 p-6 h-full">
      {/* Gradient glow */}
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Vote className="w-5 h-5 text-yellow-400" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {data.pendingCount}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Board Decisions</h3>
            <p className="text-xs text-gray-500">Executive Governance</p>
          </div>
        </div>
      </div>

      {/* Pending Vote Card */}
      <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-4 border border-yellow-500/10">
        {/* Vote Header */}
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-white">1 Pending Vote: {data.currentVote.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{data.currentVote.description}</p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            Time Remaining: {data.currentVote.timeRemaining}
          </span>
        </div>

        {/* Vote Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Votes Cast</span>
            <span className="text-sm font-medium text-white">
              {data.currentVote.votesFor}/{data.currentVote.totalVotes} votes
            </span>
          </div>
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${voteProgress}%` }}
            />
            {/* Remaining indicator */}
            <div
              className="absolute inset-y-0 bg-blue-500/50 rounded-full"
              style={{ left: `${voteProgress}%`, width: `${100 - voteProgress}%` }}
            />
          </div>
        </div>

        {/* Vote Button */}
        <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white border-0">
          <ThumbsUp className="w-4 h-4 mr-2" />
          Vote Now
        </Button>
      </div>
    </div>
  );
}
