<script setup>
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import { formatYear } from '@/utils/format';

defineProps({
  certificate: { type: Object, required: true }
});
</script>

<template>
  <a
    v-reveal
    :href="certificate.credentialUrl || undefined"
    target="_blank"
    rel="noopener"
    class="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent-500/40 hover:shadow-lift dark:border-neutral-800 dark:bg-neutral-900"
  >
    <span class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-500/5 transition-transform duration-300 group-hover:scale-150 dark:bg-accent-400/10" aria-hidden="true" />

    <img
      v-if="certificate.imageUrl"
      :src="certificate.imageUrl"
      :alt="certificate.title"
      class="relative mb-6 aspect-[16/10] w-full rounded-lg object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
      loading="lazy"
      decoding="async"
    >

    <div class="relative">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 font-mono text-sm font-bold text-accent-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-accent-300">
          {{ (certificate.issuer || certificate.title).slice(0, 1).toUpperCase() }}
        </span>
        <p class="font-mono text-xs uppercase tracking-widest text-accent-600 dark:text-accent-300">{{ certificate.issuer }}</p>
      </div>
      <h3 class="mt-5 font-display text-lg font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">{{ certificate.title }}</h3>
    </div>

    <div class="relative mt-6 flex items-center justify-between border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
      <p class="mono-label text-neutral-400 dark:text-neutral-500">Issued {{ formatYear(certificate.issuedAt) }}</p>
      <span v-if="certificate.credentialUrl" class="inline-flex items-center gap-1 font-mono text-sm text-neutral-500 transition-colors group-hover:text-accent-600 dark:text-neutral-400 dark:group-hover:text-accent-300">
        View credential
        <ArrowTopRightOnSquareIcon class="h-4 w-4" />
      </span>
    </div>
  </a>
</template>