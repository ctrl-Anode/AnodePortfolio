<script setup>
import { computed, ref } from 'vue';
import {
  Code2,
  Layers,
  Database,
  Cloud,
  Sparkles,
  Monitor,
  Server,
  Smartphone,
  FlaskConical,
  Palette,
  ShieldCheck,
  Wrench,
  HeartHandshake,
  UserRound,
  MessageCircle,
  Users,
  Tag,
  Maximize2
} from 'lucide-vue-next';
import { usePortfolioList } from '@/composables/usePortfolioList';
import SectionHeading from '@/components/portfolio/ui/SectionHeading.vue';
import EmptyState from '@/components/portfolio/ui/EmptyState.vue';
import SkillCategoryDialog from '@/components/portfolio/ui/SkillCategoryDialog.vue';

// Public lists return the full set (the server defaults public endpoints to the
// API max), so every skill is shown rather than just the first page.
const { rows: skills, loading } = usePortfolioList('skills');

// Pick a fitting icon per category by keyword. More specific matches come first;
// anything unmatched falls back to a tag.
const CATEGORY_ICONS = [
  { match: ['language', 'programming'], icon: Code2 },
  { match: ['ai', 'machine learning', 'artificial intelligence'], icon: Sparkles },
  { match: ['framework', 'library', 'libraries'], icon: Layers },
  { match: ['database', 'data', 'sql'], icon: Database },
  { match: ['devops', 'infra', 'cloud', 'deploy'], icon: Cloud },
  { match: ['frontend', 'front-end'], icon: Monitor },
  { match: ['backend', 'back-end', 'api'], icon: Server },
  { match: ['mobile', 'android', 'ios'], icon: Smartphone },
  { match: ['test', 'qa'], icon: FlaskConical },
  { match: ['design', 'ux'], icon: Palette },
  { match: ['security', 'auth'], icon: ShieldCheck },
  { match: ['interpersonal', 'people', 'team', 'collaboration'], icon: HeartHandshake },
  { match: ['communication'], icon: MessageCircle },
  { match: ['leadership', 'management'], icon: Users },
  { match: ['personal', 'self'], icon: UserRound },
  { match: ['tool'], icon: Wrench }
];

function categoryIcon(name) {
  const value = String(name || '').toLowerCase();
  const found = CATEGORY_ICONS.find(({ match }) => match.some((key) => value.includes(key)));
  return found ? found.icon : Tag;
}

// Skills created before the `type` column existed fall back to "hard".
const normalized = computed(() =>
  skills.value.map((skill) => ({ ...skill, type: skill.type === 'soft' ? 'soft' : 'hard' }))
);

// Group by category with both the categories and their skills sorted A-Z, so
// the cards are stable and alphabetical regardless of API row order.
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
    .map(([category, list]) => ({
      category,
      items: [...list].sort(byName),
      icon: categoryIcon(category)
    }));
}

const hardCards = computed(() =>
  groupByCategory(normalized.value.filter((s) => s.type === 'hard')).map((group) => ({ ...group, type: 'hard' }))
);
const softCards = computed(() =>
  groupByCategory(normalized.value.filter((s) => s.type === 'soft')).map((group) => ({ ...group, type: 'soft' }))
);

const active = ref(null);

function openCategory(card) {
  active.value = card;
}
</script>

<template>
  <section id="skills" class="scroll-mt-24 bg-neutral-50/60 dark:bg-neutral-900/30">
    <div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <SectionHeading eyebrow="Skills" title="My toolkit" subtitle="The languages, frameworks and tools I reach for every day - plus how I like to work with people. Tap a category to see the skills inside." />

      <div v-if="loading" class="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-16 animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      </div>

      <template v-else-if="normalized.length">
        <!-- Hard skills: one compact card per category, click to open -->
        <div v-if="hardCards.length" class="mt-12">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Hard skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="card in hardCards"
              :key="card.category"
              v-reveal
              type="button"
              class="group flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 dark:border-neutral-800 dark:bg-neutral-900"
              @click="openCategory(card)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                <component :is="card.icon" class="h-5 w-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100" :title="card.category">{{ card.category }}</span>
                <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ card.items.length }} {{ card.items.length === 1 ? 'skill' : 'skills' }}</span>
              </span>
              <Maximize2 class="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-accent-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Soft skills: same card pattern, listed separately -->
        <div v-if="softCards.length" class="mt-12">
          <div v-reveal class="flex items-center gap-4">
            <h3 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Soft skills</h3>
            <span class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="card in softCards"
              :key="card.category"
              v-reveal
              type="button"
              class="group flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 dark:border-neutral-800 dark:bg-neutral-900"
              @click="openCategory(card)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                <component :is="card.icon" class="h-5 w-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100" :title="card.category">{{ card.category }}</span>
                <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ card.items.length }} {{ card.items.length === 1 ? 'skill' : 'skills' }}</span>
              </span>
              <Maximize2 class="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-accent-500" aria-hidden="true" />
            </button>
          </div>
        </div>
      </template>

      <EmptyState v-else class="mt-12" title="No skills yet" hint="Add your toolkit in the admin panel and category cards will appear here." />

      <SkillCategoryDialog
        :open="!!active"
        :category="active?.category || ''"
        :icon="active?.icon || null"
        :skills="active?.items || []"
        :type="active?.type || 'hard'"
        @close="active = null"
      />
    </div>
  </section>
</template>
