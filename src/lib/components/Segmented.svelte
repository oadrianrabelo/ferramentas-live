<script lang="ts" generics="T extends string | number">
  let {
    options,
    value = $bindable(),
    label,
    onchange,
  }: {
    options: { value: T; label: string; title?: string }[];
    value: T;
    label: string;
    onchange?: (v: T) => void;
  } = $props();
</script>

<div class="seg" role="group" aria-label={label}>
  {#each options as o (o.value)}
    <button
      type="button"
      aria-pressed={value === o.value}
      title={o.title}
      onclick={() => {
        value = o.value;
        onchange?.(o.value);
      }}
    >
      {o.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--field);
    max-width: 100%;
  }
  button {
    border: 0;
    background: transparent;
    color: var(--ink);
    padding: 8px 14px;
    font-weight: 500;
    min-height: 38px;
  }
  button + button {
    border-left: 1px solid var(--line);
  }
  button[aria-pressed='true'] {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
</style>
