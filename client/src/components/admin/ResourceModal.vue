<script setup>
import { reactive, ref, watch } from 'vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseAlert from '@/components/ui/BaseAlert.vue';
import { portfolioApi } from '@/api/portfolio';
import { uploadsApi } from '@/api';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  config: { type: Object, required: true },
  item: { type: Object, default: null },
  open: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'saved']);
const toast = useToastStore();

const form = reactive({});
const saving = ref(false);
const error = ref('');
const uploadProgress = reactive({});
const uploading = reactive({});

const UPLOADERS = {
  document: uploadsApi.uploadDocument,
  certificate: uploadsApi.uploadCertificate,
  video: uploadsApi.uploadVideo,
  image: uploadsApi.uploadImage
};

const ACCEPT = {
  document: '.pdf,.doc,.docx',
  certificate: '.pdf,.jpg,.jpeg,.png,.webp',
  video: 'video/mp4,video/webm,video/quicktime',
  image: 'image/jpeg,image/png,image/webp,image/gif'
};

function acceptFor(kind) {
  return ACCEPT[kind] || ACCEPT.image;
}

function isImageValue(value) {
  return typeof value === 'string' && /\.(?:png|jpe?g|webp|gif|avif|svg)(?:\?.*)?$/i.test(value);
}

// Certificates may be a PDF or a scanned image, so only preview when the value
// actually looks like an image.
function showImage(field) {
  if (field.uploadKind === 'image') return true;
  if (field.uploadKind === 'certificate') return isImageValue(form[field.name]);
  return false;
}

async function handleUpload(field, event) {
  const file = event.target.files?.[0];
  if (!file) return;
  error.value = '';
  uploading[field.name] = true;
  uploadProgress[field.name] = 0;
  try {
    const upload = UPLOADERS[field.uploadKind] || UPLOADERS.image;
    const result = await upload(file, (percent) => {
      uploadProgress[field.name] = percent;
    });
    form[field.name] = result.url;
  } catch (err) {
    error.value = err.message || 'Upload failed';
  } finally {
    uploading[field.name] = false;
    event.target.value = '';
  }
}

function fieldValue(field, row) {
  const raw = row?.[field.name];
  if (field.type === 'date') return raw ? String(raw).slice(0, 10) : '';
  if (field.type === 'checkbox') return row ? Boolean(raw) : (field.name === 'published' ? true : false);
  if (field.type === 'list') return Array.isArray(raw) ? raw.join('\n') : '';
  if (field.type === 'json') return raw ? JSON.stringify(raw, null, 2) : '';
  return raw ?? '';
}

function resetForm() {
  error.value = '';
  for (const field of props.config.fields) form[field.name] = fieldValue(field, props.item);
}

watch([() => props.item, () => props.config, () => props.open], resetForm, { immediate: true });

function visibleFields() {
  return props.config.fields.filter((field) => !(props.item && props.config.readOnlyFields?.includes(field.name)));
}

function buildPayload() {
  const payload = {};
  const validationErrors = [];

  for (const field of visibleFields()) {
    const value = form[field.name];
    if (field.required && (value === '' || value == null)) {
      validationErrors.push(`${field.label} is required`);
      continue;
    }

    if (field.type === 'date') {
      payload[field.name] = value ? value : null;
    } else if (field.type === 'list') {
      payload[field.name] = value
        ? value.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean)
        : undefined;
    } else if (field.type === 'json') {
      if (!value || !value.trim()) continue;
      try {
        payload[field.name] = JSON.parse(value);
      } catch {
        validationErrors.push(`${field.label} must be valid JSON`);
      }
    } else if (field.type === 'number') {
      payload[field.name] = value === '' ? undefined : Number(value);
    } else {
      payload[field.name] = value;
    }
  }

  return { payload, errors: validationErrors };
}

async function save() {
  const { payload, errors } = buildPayload();
  if (errors.length > 0) {
    error.value = errors.join('. ');
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    if (props.item) {
      await portfolioApi.admin.update(props.config.resource, props.item.id, payload);
      toast.success(`${props.config.label} updated`);
    } else {
      await portfolioApi.admin.create(props.config.resource, payload);
      toast.success(`${props.config.label} created`);
    }
    emit('saved');
    emit('close');
  } catch (err) {
    const fields = err.details ? Object.entries(err.details).map(([key, message]) => `${key}: ${message}`) : [];
    error.value = fields.length ? `${err.message}: ${fields.join('; ')}` : (err.message || 'Failed to save');
  } finally {
    saving.value = false;
  }
}

const inputClass = 'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-800 dark:ring-gray-700 dark:text-gray-100';
</script>

<template>
  <BaseModal
    :open="open"
    :title="item ? `Edit ${config.label}` : `Add ${config.label}`"
    max-width="max-w-xl"
    @close="emit('close')"
  >
    <BaseAlert v-if="error" tone="error" class="mb-4">{{ error }}</BaseAlert>

    <div v-if="item && config.readOnlyFields?.length" class="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
      <p class="font-medium">{{ item.name }}</p>
      <p><span class="font-medium">Email:</span> {{ item.email }}</p>
      <p v-if="item.subject" class="mt-1"><span class="font-medium">Subject:</span> {{ item.subject }}</p>
      <p class="mt-2 whitespace-pre-line">{{ item.message }}</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <template v-for="field in visibleFields()" :key="field.name">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300" :class="field.type === 'textarea' || field.type === 'list' || field.type === 'json' ? 'col-span-2' : ''">
          {{ field.label }}{{ field.required ? ' *' : '' }}

          <input
            v-if="['text', 'url', 'number'].includes(field.type)"
            v-model="form[field.name]"
            :type="field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'"
            :class="inputClass"
          >

          <input v-else-if="field.type === 'date'" v-model="form[field.name]" type="date" :class="inputClass">
          <input v-else-if="field.type === 'checkbox'" v-model="form[field.name]" type="checkbox" class="mt-2 h-4 w-4 rounded accent-brand-600">

          <select v-else-if="field.type === 'select'" v-model="form[field.name]" :class="inputClass">
            <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
          </select>

          <template v-else-if="field.type === 'upload'">
            <input
              type="file"
              :accept="acceptFor(field.uploadKind)"
              class="mt-1 block w-full cursor-pointer text-sm text-gray-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-200 dark:hover:file:bg-gray-700"
              @change="handleUpload(field, $event)"
            >
            <span v-if="uploading[field.name]" class="mt-1 block text-xs text-gray-400">Uploading… {{ uploadProgress[field.name] }}%</span>
            <template v-else-if="form[field.name]">
              <img
                v-if="showImage(field)"
                :src="form[field.name]"
                alt=""
                class="mt-2 h-12 w-12 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
              >
              <video
                v-else-if="field.uploadKind === 'video'"
                :src="form[field.name]"
                class="mt-2 h-16 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700"
                muted
                playsinline
              />
              <a
                :href="form[field.name]"
                target="_blank"
                rel="noopener"
                class="mt-1 block truncate text-xs text-brand-600 hover:underline dark:text-brand-400"
                @click.stop
              >{{ form[field.name] }}</a>
            </template>
          </template>

          <textarea
            v-else
            v-model="form[field.name]"
            rows="4"
            :class="[inputClass, field.type === 'list' || field.type === 'json' ? 'font-mono text-xs' : '']"
          />

          <span v-if="field.hint" class="mt-1 block text-xs text-gray-400 dark:text-gray-500">{{ field.hint }}</span>
        </label>
      </template>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save()">Save</BaseButton>
    </template>
  </BaseModal>
</template>