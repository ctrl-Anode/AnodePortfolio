<script setup>
import { computed, ref } from 'vue';
import { isCustomSkillLogo, skillLogoUrl } from '@/utils/skillLogo';

const props = defineProps({
  skill: { type: Object, required: true },
  size: { type: String, default: 'md' } // 'md' for tiles, 'sm' for chips
});

const failed = ref(false);
const src = computed(() => skillLogoUrl(props.skill));
const custom = computed(() => isCustomSkillLogo(props.skill));
const initial = computed(() => (props.skill.name || '?').trim().charAt(0).toUpperCase());

const box = computed(() =>
  props.size === 'sm' ? 'h-5 w-5 rounded-md' : 'h-7 w-7 rounded-lg'
);
const imgSize = computed(() => (props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'));
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center bg-white ring-1 ring-neutral-200/80 dark:bg-neutral-800 dark:ring-neutral-700"
    :class="box"
    :aria-hidden="src && !failed ? 'true' : null"
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="`${skill.name} logo`"
      class="object-contain"
      :class="[imgSize, custom ? '' : 'dark:brightness-0 dark:invert']"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    >
    <span
      v-else
      class="font-display font-semibold text-neutral-500 dark:text-neutral-400"
      :class="size === 'sm' ? 'text-[9px]' : 'text-[11px]'"
    >{{ initial }}</span>
  </span>
</template>
