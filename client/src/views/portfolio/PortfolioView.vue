<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useProfile } from '@/composables/useProfile';
import SiteHeader from '@/components/portfolio/SiteHeader.vue';
import SiteSidebar from '@/components/portfolio/SiteSidebar.vue';
import SiteFooter from '@/components/portfolio/SiteFooter.vue';
import HeroSection from '@/components/portfolio/HeroSection.vue';
import AboutSection from '@/components/portfolio/AboutSection.vue';
import ExperienceSection from '@/components/portfolio/ExperienceSection.vue';
import ProjectsSection from '@/components/portfolio/ProjectsSection.vue';
import SkillsSection from '@/components/portfolio/SkillsSection.vue';
import CertificatesSection from '@/components/portfolio/CertificatesSection.vue';
import GithubSection from '@/components/portfolio/GithubSection.vue';
import TestimonialsSection from '@/components/portfolio/TestimonialsSection.vue';
import ContactSection from '@/components/portfolio/ContactSection.vue';
import SectionDivider from '@/components/portfolio/ui/SectionDivider.vue';

const { profile } = useProfile();

const name = computed(() => profile.value?.name || '');
const initials = computed(() =>
  name.value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
);

const links = [
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'about', label: 'About' },
  { key: 'skills', label: 'Skills' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'github', label: 'GitHub' },
  { key: 'contact', label: 'Contact' }
];

const activeSection = ref('');

let sectionObserver = null;

onMounted(() => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeSection.value = entry.target.id;
      }
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
  );
  for (const link of links) {
    const section = document.getElementById(link.key);
    if (section) sectionObserver.observe(section);
  }
});

onBeforeUnmount(() => {
  sectionObserver?.disconnect();
});
</script>

<template>
  <div class="min-h-full">
    <SiteHeader :links="links" :active-section="activeSection" :name="name" :initials="initials" />
    <SiteSidebar :links="links" :active-section="activeSection" />

    <main>
      <HeroSection />
      <SectionDivider />
      <ExperienceSection />
      <SectionDivider />
      <ProjectsSection />
      <SectionDivider />
      <AboutSection />
      <SectionDivider />
      <SkillsSection />
      <SectionDivider />
      <CertificatesSection />
      <SectionDivider />
      <GithubSection />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <ContactSection />
    </main>

    <SiteFooter :name="name" :initials="initials" :socials="profile?.socials || {}" />
  </div>
</template>