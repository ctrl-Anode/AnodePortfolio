<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { skillLogoUrl } from '@/utils/skillLogo';
import SkillLogo from '@/components/portfolio/ui/SkillLogo.vue';

defineProps({
  open: { type: Boolean, required: true },
  category: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  skills: { type: Array, default: () => [] },
  type: { type: String, default: 'hard' }
});

const emit = defineEmits(['close']);

function hasLogo(skill) {
  return Boolean(skillLogoUrl(skill));
}
</script>

<template>
  <TransitionRoot :show="open" as="template">
    <Dialog class="relative z-50" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 sm:items-center">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 translate-y-4 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:scale-95"
          >
            <DialogPanel
              class="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 dark:ring-1 dark:ring-neutral-800 sm:p-6"
            >
              <div class="flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                  <component :is="icon" v-if="icon" class="h-5 w-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <DialogTitle class="font-display text-lg font-semibold text-neutral-900 dark:text-white">
                    {{ category }}
                  </DialogTitle>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ skills.length }} {{ skills.length === 1 ? 'skill' : 'skills' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="-mr-1 -mt-1 rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  aria-label="Close"
                  @click="emit('close')"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>

              <div class="mt-5 max-h-[60vh] overflow-y-auto pr-1">
                <ul v-if="type === 'hard'" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <li
                    v-for="skill in skills"
                    :key="skill.id"
                    class="flex min-w-0 items-center gap-2.5 rounded-lg border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <SkillLogo :skill="skill" />
                    <span class="min-w-0 break-words text-sm font-medium leading-tight text-neutral-800 dark:text-neutral-100">{{ skill.name }}</span>
                  </li>
                </ul>

                <ul v-else class="flex flex-wrap gap-2">
                  <li
                    v-for="skill in skills"
                    :key="skill.id"
                    class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  >
                    <SkillLogo v-if="hasLogo(skill)" :skill="skill" size="sm" />
                    {{ skill.name }}
                  </li>
                </ul>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
