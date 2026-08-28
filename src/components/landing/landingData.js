import { PLANT_STAGES } from "../../lib/plantStages";

export const LANDING_STAGES = PLANT_STAGES.map(stage => ({
    ...stage,
    presentationStatus: stage.statusText || stage.label,
}));

export const SAMPLE_APPLICATIONS = [
    { company: "Linear", role: "Senior Frontend Engineer", stage: LANDING_STAGES[0], detail: "Saved today" },
    { company: "Stripe", role: "Platform Engineer", stage: LANDING_STAGES[1], detail: "Applied 2 days ago" },
    { company: "Google", role: "Senior Backend Engineer", stage: LANDING_STAGES[3], detail: "Technical interview" },
    { company: "Shopify", role: "Staff Engineer", stage: LANDING_STAGES[4], detail: "Offer received" },
];

export const stageFor = id => LANDING_STAGES.find(stage => stage.id === id) || LANDING_STAGES[0];
