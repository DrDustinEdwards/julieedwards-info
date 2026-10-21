// All editable content for julieedwards.info lives here.
// House rules: no em dashes, no cheesy copy.
//
// IMAGES: paste Cloudflare R2 URLs into the `images` object when the bucket is
// live. Until then, sections render tasteful green placeholder blocks.

export const siteUrl = "https://julieedwards.info";
export const district = { name: "Bluff Dale ISD", url: "https://www.bdisd.net" };

export const profile = {
  name: "Julie Edwards",
  office: "Bluff Dale ISD School Board Trustee",
  // TODO: confirm the public contact email shown on the old site.
  email: "julieedwards+bdisd@gmail.com",
  facebook: "https://www.facebook.com/julieedwardsforbdisd",
  address: {
    name: district.name,
    line1: "430 FM 2481",
    line2: "Bluff Dale, TX 76433",
    mapsUrl: "https://www.google.com/maps/place/430+FM+2481+Bluff+Dale+TX+76433",
  },
};

export const images = {
  about: "https://content.julieedwards.info/julie-edwards-bluff-dale-profile.jpg", // profile photo (R2)
  portrait: "", // candidate photo (R2 URL)
  flyer: "", // campaign flyer PDF (R2 URL)
};

export const navLinks = [
  { label: "Priorities", href: "#why" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export const boardLinks = [
  { label: "School Board", href: "https://www.bdisd.net/223653_2" },
  { label: "Board of Trustees", href: "https://www.bdisd.net/136152_3" },
  { label: "Board Meeting & Agenda", href: "https://www.bdisd.net/136148_3" },
  { label: "Board Policies", href: "https://www.bdisd.net/136150_3" },
  { label: "Board Operating Procedures", href: "https://www.bdisd.net/136149_3" },
  { label: "Board Meeting Minutes", href: "https://www.bdisd.net/136159_3" },
];

export const why = {
  pillars: [
    { title: "Education", body: "Support continued academic excellence." },
    { title: "Integrity", body: "Promote an environment of transparency, communication, and accountability for the school and the Board of Trustees." },
    { title: "Student Success", body: "Ensure all students receive the support and tools they will need to be successful both inside and outside of the classroom." },
  ],
};

export const about = {
  paragraphs: [
    "My name is Julie Edwards, and I have lived in Bluff Dale since 2015. My husband and I have two daughters who attend Bluff Dale ISD schools. They love being Bobcats, and we love that the school has high academic standards but is small enough that the students receive individualized attention tailored to their unique needs. On the board, I work to maintain and improve this supportive and academically rigorous environment.",
    "I am a scientific editor, and my husband is a biology professor at Tarleton. My foundation in science serves me well on the board. I am trained to look at all sides of an issue, gather information, and make an informed decision. I apply this skill set to my responsibilities as a board member. I do my homework and make decisions that are in the best interests of the students to ensure that Bluff Dale continues to be a wonderful school for the children in our community.",
    "I serve on the Bluff Dale ISD Board of Trustees as a parent who wants our school to be the best it can be and a safe, welcoming, and supportive environment for all students.",
  ],
};

export const experience = [
  { title: "Prior Board Experience", body: "In Houston, I served on the Board of Directors for a non-profit that supported the city animal shelter. This gave me direct experience as a board member and managing a budget. My entire career has been spent working on complex projects as part of a team, so I am adept at committee work. I thrive in a team environment, and I understand that the school board is not just one person but a group of people working together for the benefit of the students who attend our school now and in the future." },
  { title: "Financial Experience", body: "In addition to my work at the non-profit, I manage orders for clients around the world in my current position to tailor our services to their budget and ensure that we remain within our agreed upon budget. I understand the importance of adopting a sound budget and then staying within that budget." },
  { title: "Education Experience", body: "When I was in graduate school in Houston, I participated in a fellowship program where I taught lessons at local elementary schools, and elementary school teachers worked with me in a biomedical research lab for a few weeks. This was my first exposure to public education as an adult, and from this experience, I also saw the perspective of a teacher. More recently, I taught lecture courses at Tarleton State University, including freshman biology, so I understand the skills students need to succeed in college." },
  { title: "Community Engagement", body: "Community engagement is an important function of the school board and critical for the success of the school. I have volunteered for many years in the school and in the community. My husband and I worked with the freshman class on a computer-based biology project when the high school first opened. I also organized educational community events for children and adults tailored to the interests of our community. Topics ranged from snakes with Mark Pyle and bugs with Fossil Rim Conservation Center to gardening with an Erath County Master Gardener to weather with the Texas Storm Chasers. Education and community go hand in hand. For Bluff Dale to thrive and grow, we need a strong school and a strong community." },
];
