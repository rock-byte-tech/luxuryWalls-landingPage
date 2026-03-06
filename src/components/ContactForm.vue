<template>
  <form @submit.prevent="submitForm" class="rounded-3xl border border-gold-luxury/40 bg-[#0f0f0f] p-6 sm:p-8">
    <div class="grid gap-4">
      <label class="text-xs tracking-[0.14em] uppercase text-gold-luxury">{{ formLabels.nameLabel }}</label>
      <input
        v-model.trim="formState.name"
        type="text"
        name="name"
        placeholder="Your full name"
        class="rounded-xl border border-gold-luxury/45 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-gold-luxury"
      />

      <label class="text-xs tracking-[0.14em] uppercase text-gold-luxury">{{ formLabels.emailLabel }}</label>
      <input
        v-model.trim="formState.email"
        type="email"
        name="email"
        placeholder="you@email.com"
        class="rounded-xl border border-gold-luxury/45 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-gold-luxury"
      />

      <label class="text-xs tracking-[0.14em] uppercase text-gold-luxury">{{ formLabels.phoneLabel }}</label>
      <input
        v-model.trim="formState.phone"
        type="tel"
        name="phone"
        placeholder="+1 (___) ___-____"
        class="rounded-xl border border-gold-luxury/45 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-gold-luxury"
      />

      <label class="text-xs tracking-[0.14em] uppercase text-gold-luxury">{{ formLabels.serviceLabel }}</label>
      <select
        v-model="formState.service"
        name="service"
        class="rounded-xl border border-gold-luxury/45 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-gold-luxury"
      >
        <option value="" class="bg-ebony text-white">Select a service</option>
        <option v-for="service in services" :key="service.id" :value="service.id" class="bg-ebony text-white">
          {{ service.title }}
        </option>
      </select>

      <label class="text-xs tracking-[0.14em] uppercase text-gold-luxury">{{ formLabels.messageLabel }}</label>
      <textarea
        v-model.trim="formState.message"
        name="message"
        rows="4"
        placeholder="Share your space goals, materials, and target completion date."
        class="rounded-xl border border-gold-luxury/45 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-gold-luxury"
      ></textarea>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="mt-2 inline-flex w-fit rounded-full border border-gold-luxury px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-gold-luxury transition hover:bg-gold-luxury/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {{ isSubmitting ? "Sending..." : formLabels.submitLabel }}
      </button>

      <p v-if="feedback.message" :class="feedback.type === 'success' ? 'text-sm text-cyan-electric' : 'text-sm text-red-300'">
        {{ feedback.message }}
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";

interface FormLabels {
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  serviceLabel: string;
  messageLabel: string;
  submitLabel: string;
}

interface ServiceOption {
  id: string;
  title: string;
}

const props = defineProps<{
  formLabels: FormLabels;
  services: ServiceOption[];
  endpoint?: string;
}>();

const formState = reactive({
  name: "",
  email: "",
  phone: "",
  service: "",
  message: "",
});

const isSubmitting = ref(false);
const feedback = reactive({
  type: "",
  message: "",
});

const endpoint = props.endpoint || import.meta.env.PUBLIC_CONTACT_ENDPOINT || "/api/contact";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resetFeedback = () => {
  feedback.type = "";
  feedback.message = "";
};

const submitForm = async () => {
  resetFeedback();

  if (!formState.name || !formState.email || !formState.message) {
    feedback.type = "error";
    feedback.message = "Please complete name, email, and project details.";
    return;
  }

  if (!emailRegex.test(formState.email)) {
    feedback.type = "error";
    feedback.message = "Please provide a valid email address.";
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formState),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Unable to send your message right now.");
    }

    formState.name = "";
    formState.email = "";
    formState.phone = "";
    formState.service = "";
    formState.message = "";

    feedback.type = "success";
    feedback.message = "Thanks. Your inquiry was sent successfully.";
  } catch (error) {
    feedback.type = "error";
    feedback.message = error instanceof Error ? error.message : "Unexpected error. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
