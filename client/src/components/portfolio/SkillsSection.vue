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

function groupByCategory(items) {
  const map = new Map();
  for (const skill of items) {
    const category = skill.category || 'Other';
    if (!map.has(category)) map.set(category, []);
    map.get(category).push(skill);
  }
  return Array.from(map.entries());
}

const hardGroups = computed(() => groupByCategory(normalized.value.filter((s) => s.type === 'hard')));
const softGroups = computed(() => groupByCategory(normalized.value.filter((s) => s.type === 'soft')));

function clampLevel(level) {
  return Math.min(Math.max(Number(level) || 0, 0), 100);
}

function hasLogo(skill) {
  return Boolean(skillLogoUrl(skill));
}
</script>

<template>
  <section id="skills" class="scroll-mt-24 bg-neutral-50/60 dark:bg-neutral-900/30">
    <div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <SectionHeading eyebrow="Skills" title="My toolkit" subtitle="The languages, frameworks and tools I reach for every day - plus how I like to work with people." />

      <div v-if="loading" class="mt-12 grid gap-8 sm:grid-cols-2">
        <div v-for="i in 4" :key="i" class="space-y-4">
          <p class="skeleton h-5 w-32" />
          <p class="skeleton h-14 w-full" />
          <p class="skeleton h-14 w-full" />
        </div>
      </div>

      <template v-else-if="normalized.length">
        <!-- Hard skills: languages, frameworks, AI tools, ... with a logo each -->
        <div v-if="hardGroups.length" class="mt-14">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Hard skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div class="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            <div
              v-for="([category, items], index) in hardGroups"
              :key="category"
              v-reveal
              :class="{ 'delay-100': index % 2 === 1 }"
            >
              <h4 class="mono-label mb-4 text-accent-600 dark:text-accent-300">{{ category }}</h4>

              <ul class="space-y-3">
                <li
                  v-for="skill in items"
                  :key="skill.id"
                  class="flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white p-3 shadow-sm transition-colors hover:border-accent-500/40 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <SkillLogo :skill="skill" />

                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline justify-between gap-3">
                      <span class="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ skill.name }}</span>
                      <span v-if="skill.level != null" class="font-mono text-xs text-neutral-400 dark:text-neutral-500">{{ clampLevel(skill.level) }}%</span>
                    </div>
                    <div v-if="skill.level != null" class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                      <div
                        class="skill-fill h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600"
                        :style="{ '--level': `${clampLevel(skill.level)}%` }"
                      />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Soft skills: interpersonal strengths rendered as chips -->
        <div v-if="softGroups.length" class="mt-16">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Soft skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div v-reveal class="mt-8 space-y-7">
            <div v-for="[category, items] in softGroups" :key="category">
              <h4 class="mono-label mb-3 text-neutral-400 dark:text-neutral-500">{{ category }}</h4>
              <ul class="flex flex-wrap gap-2.5">
                <li
                  v-for="skill in items"
                  :key="skill.id"
                  class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:border-accent-500/40 hover:text-accent-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-accent-300"
                >
                  <SkillLogo v-if="hasLogo(skill)" :skill="skill" size="sm" />
                  {{ skill.name }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <EmptyState v-else class="mt-12" title="No skills yet" hint="Add your toolkit in the admin panel and grouped lists will appear here." />
    </div>
  </section>
</template>
