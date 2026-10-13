<script setup>
import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowPathIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { portfolioApi } from '@/api/portfolio';
import { findResourceConfig } from '@/config/portfolioResources';
import PageHeader from '@/components/ui/PageHeader.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import DataTable from '@/components/common/DataTable.vue';
import ResourceModal from '@/components/admin/ResourceModal.vue';
import { useToastStore } from '@/stores/toast';
import { formatMonthYear } from '@/utils/format';
import { skillLogoUrl } from '@/utils/skillLogo';

const route = useRoute();
const toast = useToastStore();

const config = computed(() => findResourceConfig(route.params.resource));

const tableRef = ref(null);
const addOpen = ref(false);
const editing = ref(null);
const modalOpen = ref(false);

function badge(value, tone) {
  const tones = {
    green: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
    gray: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
  };
  return h(
    'span',
    { class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone] || tones.gray}` },
    String(value)
  );
}

function badgeToneFor(column, value) {
  if (column.badgeTone?.[value]) return column.badgeTone[value];
  if (typeof value === 'boolean') return value ? 'green' : 'gray';
  return 'gray';
}

const columns = computed(() => {
  if (!config.value) return [];

  const cols = config.value.columns.map((column) => {
    const def = { accessorKey: column.accessorKey, header: column.header };

    if (column.render === 'date') {
      def.cell = (info) =>
        h('span', { class: 'whitespace-nowrap text-gray-500 dark:text-gray-400' }, info.getValue() ? formatMonthYear(info.getValue()) : (column.fallback ?? ''));
    } else if (column.render === 'bool') {
      def.cell = (info) => badge(info.getValue() ? 'Yes' : 'No', badgeToneFor(column, info.getValue()));
    } else if (column.render === 'badge') {
      def.cell = (info) => badge(info.getValue() ?? '—', badgeToneFor(column, info.getValue()));
    } else if (column.render === 'image') {
      def.cell = (info) => {
        const row = info.row.original || {};
        const src = 'icon' in row || 'logoUrl' in row ? skillLogoUrl(row) : info.getValue();
        if (!src) return h('span', { class: 'text-gray-400 dark:text-gray-500' }, '—');
        return h('img', {
          src,
          alt: '',
          loading: 'lazy',
          class: 'h-8 w-8 rounded-lg object-contain ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700'
        });
      };
    } else {
      def.cell = (info) => {
        const text = info.getValue() == null ? '' : String(info.getValue());
        return text.length > 60 ? h('span', { title: text }, `${text.slice(0, 60)}…`) : h('span', text);
      };
    }
    return def;
  });

  cols.push({
    id: 'actions',
    header: '',
    accessorFn: () => '',
    meta: { noSort: true, sortKey: '__none__', alignRight: true },
    cell: (info) => {
      const row = info.row.original;
      return h('div', { class: 'flex justify-end gap-3' }, [
        config.value.canDelete !== false
          ? h('button', {
              class: 'text-gray-400 transition-colors hover:text-red-500',
              title: `Delete ${config.value.label}`,
              type: 'button',
              onClick: () => remove(row)
            }, [h(TrashIcon, { class: 'h-4 w-4' })])
          : null,
        h('button', {
          class: 'text-gray-400 transition-colors hover:text-brand-600',
          title: `Edit ${config.value.label}`,
          type: 'button',
          onClick: () => {
            editing.value = row;
            modalOpen.value = true;
          }
        }, [h(PencilSquareIcon, { class: 'h-4 w-4' })])
      ]);
    }
  });

  return cols;
});

function fetcher(params) {
  return portfolioApi.admin.list(config.value.resource, params).then((data) => ({ rows: data.data, total: data.meta.total }));
}

const githubConfigured = ref(false);
const syncing = ref(false);

onMounted(async () => {
  if (config.value?.resource === 'github') {
    try {
      const info = await portfolioApi.githubConfig();
      githubConfigured.value = info.configured;
    } catch {
      githubConfigured.value = false;
    }
  }
});

async function syncGithub() {
  syncing.value = true;
  try {
    const result = await portfolioApi.admin.syncGithub();
    toast.success('GitHub synced', `${result.synced} repositories merged`);
    tableRef.value?.refresh();
  } catch (err) {
    toast.error('Sync failed', err.message || 'Could not reach the GitHub API.');
  } finally {
    syncing.value = false;
  }
}

async function remove(row) {
  if (!window.confirm(`Delete this ${config.value.label.toLowerCase()}? This cannot be undone.`)) return;
  try {
    await portfolioApi.admin.remove(config.value.resource, row.id);
    toast.success(`${config.value.label} deleted`);
    tableRef.value?.refresh();
  } catch (err) {
    toast.error('Delete failed', err.message || 'Something went wrong.');
  }
}
</script>

<template>
  <div>
    <PageHeader :title="config ? config.labelPlural : 'Portfolio content'" :subtitle="config?.description">
      <template #actions>
        <div class="flex flex-wrap items-center gap-3">
          <BaseButton
            v-if="config && config.resource === 'github' && githubConfigured"
            variant="secondary"
            :loading="syncing"
            @click="syncGithub()"
          >
            <ArrowPathIcon class="h-4 w-4" />
            Sync from GitHub
          </BaseButton>
          <BaseButton v-if="config && config.canCreate !== false" @click="editing = null; addOpen = true">
            <PlusIcon class="h-4 w-4" />
            Add {{ config.label }}
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <div class="rounded-xl bg-white p-4 shadow-card ring-1 ring-gray-200/70 dark:bg-gray-900 dark:ring-gray-800 sm:p-6">
      <DataTable v-if="config" ref="tableRef" :key="config.resource" :columns="columns" :fetcher="fetcher" />
    </div>

    <ResourceModal
      v-if="config"
      :open="modalOpen || addOpen"
      :config="config"
      :item="addOpen ? null : editing"
      @saved="tableRef?.refresh()"
      @close="modalOpen = false; addOpen = false"
    />
  </div>
</template>