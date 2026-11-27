import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, UploadCloud } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';

interface CloudSyncBannerProps {
  workspaceLabel: string;
  syncState?: 'idle' | 'saving' | 'synced' | 'error';
  showPushDraft?: boolean;
  onPushDraft?: () => void;
}

export function CloudSyncBanner({
  workspaceLabel,
  syncState = 'idle',
  showPushDraft = false,
  onPushDraft,
}: CloudSyncBannerProps) {
  const {
    user,
    isAdmin,
    authReady,
    authLoading,
    authError,
    signInWithGoogle,
    signOutUser,
    clearAuthError,
  } = useFirebase();

  return (
    <div className="no-print bg-surface-container-low rounded p-4 border border-brass/30 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!authReady ? (
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <RefreshCw className="w-4 h-4 text-secondary animate-spin shrink-0" />
            <span>Checking Southern Well cloud session...</span>
          </div>
        ) : user ? (
          <>
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <Cloud className="w-4 h-4 text-sage shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 text-xs sm:text-sm">
                <p className="text-primary-container font-medium truncate">
                  Cloud Synced · {user.email}
                  {isAdmin ? ' (Practice Admin)' : ''}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {syncState === 'saving'
                    ? `Saving ${workspaceLabel} updates to encrypted cloud storage...`
                    : syncState === 'synced'
                      ? `${workspaceLabel} synchronized across your signed-in devices.`
                      : syncState === 'error'
                        ? 'Cloud sync paused. Changes remain saved locally in this browser.'
                        : `${workspaceLabel} connected to your private Southern Well account.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {showPushDraft && onPushDraft && (
                <button
                  type="button"
                  onClick={onPushDraft}
                  className="min-h-[38px] px-3 py-1.5 rounded bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Save Local Draft to Cloud</span>
                </button>
              )}
              <button
                type="button"
                disabled={authLoading}
                onClick={() => void signOutUser()}
                className="min-h-[38px] px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-xs font-medium text-primary-container hover:bg-surface-container disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-secondary" />
                <span>Sign out</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <CloudOff className="w-4 h-4 text-secondary shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs sm:text-sm">
                <p className="text-primary-container font-medium">
                  Local Browser Storage Active
                </p>
                <p className="text-xs text-on-surface-variant">
                  Sign in with Google to save and sync your {workspaceLabel} securely across devices.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={authLoading}
              onClick={() => void signInWithGoogle()}
              className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-container disabled:opacity-50 transition-colors inline-flex items-center gap-2 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </>
        )}
      </div>

      {authError && (
        <div
          role="alert"
          className="p-2.5 rounded bg-red-50 border border-red-200 flex items-center justify-between gap-2 text-xs text-red-900"
        >
          <span>{authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="font-semibold underline underline-offset-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
