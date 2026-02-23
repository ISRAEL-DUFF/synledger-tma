import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SavedRecipient } from '@/lib/remittanceData';
import { 
  User, 
  Plus, 
  Search, 
  Trash2, 
  Clock,
  ChevronRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecipientSelectorProps {
  recipients: SavedRecipient[];
  onSelect: (recipient: SavedRecipient) => void;
  onAddNew: () => void;
  onDelete: (recipientId: string) => void;
}

export function RecipientSelector({
  recipients,
  onSelect,
  onAddNew,
  onDelete,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredRecipients = recipients.filter(r =>
    r.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.accountNumber.includes(searchQuery)
  );

  const handleDelete = (e: React.MouseEvent, recipientId: string) => {
    e.stopPropagation();
    if (deleteConfirmId === recipientId) {
      onDelete(recipientId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(recipientId);
      // Reset after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Add New */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={onAddNew}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      {/* Recipients List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredRecipients.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {searchQuery 
                  ? 'No recipients found' 
                  : 'No saved recipients yet'}
              </p>
              <Button
                variant="link"
                onClick={onAddNew}
                className="mt-2 text-primary"
              >
                Add your first recipient
              </Button>
            </motion.div>
          ) : (
            filteredRecipients.map((recipient, index) => (
              <motion.div
                key={recipient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  variant="elevated"
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelect(recipient)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {recipient.nickname.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {recipient.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{recipient.bankName}</span>
                        <span>•</span>
                        <span>{recipient.accountNumber.slice(-4).padStart(10, '•')}</span>
                      </div>
                      {recipient.lastUsed && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Used {formatDistanceToNow(recipient.lastUsed, { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          deleteConfirmId === recipient.id 
                            ? 'text-destructive bg-destructive/10' 
                            : 'text-muted-foreground'
                        }`}
                        onClick={(e) => handleDelete(e, recipient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
