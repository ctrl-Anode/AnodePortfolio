<script setup>
import { computed } from 'vue';
import { usePortfolioList } from '@/composables/usePortfolioList';
import { skillLogoUrl } from '@/utils/skillLogo';
import SectionHeading from '@/components/portfolio/ui/SectionHeading.vue';
import SkillLogo from '@/components/portfolio/ui/SkillLogo.vue';
import EmptyState from '@/components/portfolio/ui/EmptyState.vue';

const { rows: skills, loading } = usePortfolioList('skills');

// Skills created before the `type` column existed fall back to "hard".
const normalized = computed(() =>
  skills.value.map((skill) => ({ ...skill, type: skill.type === 'soft' ? 'soft' : 'hard' }))
);

// Group by category with both the categories and their skills sorted A-Z, so
// the public list is stable and alphabetical regardless of API row order.
function groupByCategory(items) {
  const map = new Map();
  for (const skill of items) {
    const category = skill.category || 'Other';
    if (!map.has(category)) map.set(category, []);
    map.get(category).push(skill);
  }
  const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([category, list]) => [category, [...list].sort(byName)]);
}

const hardGroups = computed(() => groupByCategory(normalized.value.filter((s) => s.type === 'hard')));
const softGroups = computed(() => groupByCategory(normalized.value.filter((s) => s.type === 'soft')));

// Chips only show a logo when the skill actually defines one, so text-only
// soft skills stay compact.
function hasLogo(skill) {
  return Boolean(skillLogoUrl(skill));
}
</script>

<template>
  <section id="skills" class="scroll-mt-24 bg-neutral-50/60 dark:bg-neutral-900/30">
    <div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <SectionHeading eyebrow="Skills" title="My toolkit" subtitle="The languages, frameworks and tools I reach for every day - plus how I like to work with people." />

      <div v-if="loading" class="mt-12 space-y-8">
        <div v-for="i in 2" :key="i" class="space-y-3">
          <p class="skeleton h-4 w-24" />
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <p v-for="j in 8" :key="j" class="skeleton h-10 w-full" />
          </div>
        </div>
      </div>

      <template v-else-if="normalized.length">
        <!-- Hard skills: languages, frameworks, AI tools, ... each with a logo -->
        <div v-if="hardGroups.length" class="mt-12 space-y-8">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Hard skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div v-for="[category, items] in hardGroups" :key="category" v-reveal class="space-y-3">
            <h4 class="mono-label text-accent-600 dark:text-accent-300">{{ category }}</h4>
            <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <li
                v-for="skill in items"
                :key="skill.id"
                class="flex min-w-0 items-center gap-2.5 rounded-lg border border-neutral-200/70 bg-white px-3 py-2 shadow-sm transition-colors hover:border-accent-500/40 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <SkillLogo :skill="skill" />
                <span class="min-w-0 break-words text-sm font-medium leading-tight text-neutral-800 dark:text-neutral-100">{{ skill.name }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Soft skills: interpersonal strengths rendered as compact pills -->
        <div v-if="softGroups.length" class="mt-12 space-y-8">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Soft skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div v-for="[category, items] in softGroups" :key="category" v-reveal class="space-y-3">
            <h4 class="mono-label text-neutral-400 dark:text-neutral-500">{{ category }}</h4>
            <ul class="flex flex-wrap gap-2">
              <li
                v-for="skill in items"
                :key="skill.id"
                class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:border-accent-500/40 hover:text-accent-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-accent-300"
              >
                <SkillLogo v-if="hasLogo(skill)" :skill="skill" size="sm" />
                {{ skill.name }}
              </li>
            </ul>
          </div>
        </div>
      </template>

      <EmptyState v-else class="mt-12" title="No skills yet" hint="Add your toolkit in the admin panel and grouped lists will appear here." />
    </div>
  </section>
</template>
