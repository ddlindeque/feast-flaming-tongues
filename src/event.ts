/**
 * Facts taken from the group chat export (29 Aug 2026 through 22 Nov 2026).
 * The house address lives in data/private.json, which is not part of the site
 * until a guest has signed in, and is not committed.
 * Anything the group has not decided is left open on purpose.
 */

export interface Category {
  number: string;
  name: string;
  summary: string;
}

export interface Brewing {
  what: string;
  who: string;
}

export const event = {
  title: "Feast of the Flaming Tongues",
  year: 2027,
  proposed: {
    iso: "2027-08-28",
    weekday: "Saturday",
    day: "28",
    month: "August",
    year: "2027",
    context: "August bank holiday weekend",
    status:
      "Proposed in the group on 22 November 2026. Nobody has answered that message yet, so treat it as the date on the table.",
  },
  lede: "A day of drinks, great food, and a bit of friendly competition. Grow a chilli, make something with one, or just turn up to taste and vote.",
  invitation:
    "You do not need to be a gardener or a chef. Bring something spicy, or bring yourself and a pencil. Scoring is secret. The eating challenge is voluntary.",
  categories: [
    {
      number: "01",
      name: "Homegrown Heroes",
      summary: "Points for growing your own chilli plants.",
    },
    {
      number: "02",
      name: "Chilli Creations",
      summary:
        "Best homemade chilli product: sauces, jams, oils, hot honey, spicy bakes, and the rest of the jar shelf.",
    },
    {
      number: "03",
      name: "Variety & Diversity",
      summary: "Rare or interesting chilli varieties, grown or brought along.",
    },
    {
      number: "04",
      name: "Wildcard / Fun",
      summary: "Best chilli-themed snack, drink, or oddity.",
    },
    {
      number: "05",
      name: "The Main Event",
      summary: "A voluntary chilli-eating challenge for the brave. Sitting it out is a complete way to spend the day.",
    },
  ] satisfies Category[],
  brewing: [
    { what: "Chilli cider", who: "Madelein" },
    { what: "Chilli gin", who: "Wes" },
  ] satisfies Brewing[],
  keen: ["Claire", "Madelein", "Ronan", "Sharon", "Wes", "Matt", "Charlotte", "Debbie"],
  open: [
    "The hour the feast starts and ends.",
    "How the secret scores are collected and counted.",
    "Whether 28 August suits everyone. It was asked, not settled.",
  ],
  growing: [
    {
      when: "This winter",
      detail: "Pick seeds and decide which category you are feeding. Chillies need a long run, which is why the idea went out in August 2026.",
    },
    {
      when: "Late winter",
      detail: "Sow indoors. A windowsill or a propagator is enough to get plants ahead of summer.",
    },
    {
      when: "After the last frost",
      detail: "Harden the plants off and pot them on. Fruit wants the warm months.",
    },
    {
      when: "Summer",
      detail: "Cook, steep, and bottle. Sauces, gin, cider, bakes, and the odd experiment.",
    },
    {
      when: "28 August 2027",
      detail: "Bring the plant, the jar, or just an appetite to the house. Taste, score in secret, and clap for whoever faces the challenge.",
    },
  ],
};
