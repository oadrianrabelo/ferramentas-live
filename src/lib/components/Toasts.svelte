<script lang="ts">
  import { toast } from '../stores.svelte';
</script>

<div class="toasts" role="status" aria-live="polite">
  {#each toast.list as t (t.id)}
    <div class="toast {t.kind}">{t.text}</div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    display: grid;
    gap: 8px;
    z-index: 100;
    width: min(92vw, 440px);
    pointer-events: none;
  }
  .toast {
    background: var(--ink);
    color: var(--bg);
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.3);
    animation: pop 0.18s ease-out;
    border-left: 4px solid var(--muted);
  }
  .toast.ok {
    border-left-color: var(--ok);
  }
  .toast.warn {
    border-left-color: var(--warn);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
