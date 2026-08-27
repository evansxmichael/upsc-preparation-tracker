export interface TopicItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface SubjectSection {
  id: string;
  name: string;
  topics: TopicItem[];
}

export interface SyllabusCategory {
  id: string;
  categoryTitle: string;
  subTitle?: string;
  subjects: SubjectSection[];
}

export const INITIAL_SYLLABUS: SyllabusCategory[] = [
  {
    id: "foundation",
    categoryTitle: "FOUNDATION",
    subTitle: "NCERT",
    subjects: [
      {
        id: "f-hist",
        name: "History",
        topics: [
          { id: "fh-1", title: "Class VI – Our Pasts I", completed: false },
          { id: "fh-2", title: "Class VII – Our Pasts II", completed: false },
          { id: "fh-3", title: "Class VIII – Our Pasts III (Parts 1 & 2)", completed: false },
          { id: "fh-4", title: "Class IX – India and the Contemporary World I", completed: false },
          { id: "fh-5", title: "Class X – India and the Contemporary World II", completed: false },
          { id: "fh-6", title: "Class XI – Themes in World History", completed: false },
          { id: "fh-7", title: "Class XII – Themes in Indian History I", completed: false },
          { id: "fh-8", title: "Class XII – Themes in Indian History II", completed: false },
          { id: "fh-9", title: "Class XII – Themes in Indian History III", completed: false },
          { id: "fh-10", title: "Old NCERT – Ancient India (R.S. Sharma)", completed: false },
          { id: "fh-11", title: "Old NCERT – Medieval India (Satish Chandra)", completed: false },
          { id: "fh-12", title: "Old NCERT – Modern India (Bipan Chandra)", completed: false },
        ],
      },
      {
        id: "f-geo",
        name: "Geography",
        topics: [
          { id: "fg-1", title: "Class VI – The Earth: Our Habitat", completed: false },
          { id: "fg-2", title: "Class VII – Our Environment", completed: false },
          { id: "fg-3", title: "Class VIII – Resource and Development", completed: false },
          { id: "fg-4", title: "Class IX – Contemporary India I", completed: false },
          { id: "fg-5", title: "Class X – Contemporary India II", completed: false },
          { id: "fg-6", title: "Class XI – Fundamentals of Physical Geography", completed: false },
          { id: "fg-7", title: "Class XI – India: Physical Environment", completed: false },
          { id: "fg-8", title: "Class XII – Fundamentals of Human Geography", completed: false },
          { id: "fg-9", title: "Class XII – India: People and Economy", completed: false },
        ],
      },
      {
        id: "f-pol",
        name: "Polity",
        topics: [
          { id: "fp-1", title: "Class IX – Democratic Politics I", completed: false },
          { id: "fp-2", title: "Class X – Democratic Politics II", completed: false },
          { id: "fp-3", title: "Class XI – Indian Constitution at Work", completed: false },
          { id: "fp-4", title: "Class XI – Political Theory", completed: false },
          { id: "fp-5", title: "Class XII – Contemporary World Politics", completed: false },
          { id: "fp-6", title: "Class XII – Politics in India since Independence", completed: false },
        ],
      },
      {
        id: "f-eco",
        name: "Economics",
        topics: [
          { id: "fe-1", title: "Class IX – Economics", completed: false },
          { id: "fe-2", title: "Class X – Understanding Economic Development", completed: false },
          { id: "fe-3", title: "Class XI – Indian Economic Development", completed: false },
          { id: "fe-4", title: "Class XII – Introductory Microeconomics", completed: false },
          { id: "fe-5", title: "Class XII – Introductory Macroeconomics", completed: false },
        ],
      },
      {
        id: "f-sci",
        name: "Science",
        topics: [
          { id: "fs-1", title: "Class VI – Science", completed: false },
          { id: "fs-2", title: "Class VII – Science", completed: false },
          { id: "fs-3", title: "Class VIII – Science", completed: false },
          { id: "fs-4", title: "Class IX – Science", completed: false },
          { id: "fs-5", title: "Class X – Science", completed: false },
        ],
      },
    ],
  },
  {
    id: "prelims",
    categoryTitle: "PRELIMS",
    subjects: [
      {
        id: "p-gs1",
        name: "GS Paper 1",
        topics: [
          { id: "pg-1", title: "Current events – national & international", completed: false },
          { id: "pg-2", title: "Ancient Indian history", completed: false },
          { id: "pg-3", title: "Medieval Indian history", completed: false },
          { id: "pg-4", title: "Modern Indian history & freedom struggle", completed: false },
          { id: "pg-5", title: "Indian art & culture", completed: false },
          { id: "pg-6", title: "Physical geography", completed: false },
          { id: "pg-7", title: "Indian geography", completed: false },
          { id: "pg-8", title: "World geography", completed: false },
          { id: "pg-9", title: "Indian polity & governance", completed: false },
          { id: "pg-10", title: "Economic & social development", completed: false },
          { id: "pg-11", title: "Environment, ecology & climate change", completed: false },
          { id: "pg-12", title: "General science", completed: false },
        ],
      },
      {
        id: "p-csat",
        name: "CSAT Paper 2 (Qualifying)",
        topics: [
          { id: "pc-1", title: "Reading Comprehension", completed: false },
          { id: "pc-2", title: "Interpersonal Skills & Communication", completed: false },
          { id: "pc-3", title: "Logical Reasoning & Analytical Ability", completed: false },
          { id: "pc-4", title: "Decision Making & Problem Solving", completed: false },
          { id: "pc-5", title: "General Mental Ability", completed: false },
          { id: "pc-6", title: "Basic Numeracy (Numbers & Relations - Class X level)", completed: false },
          { id: "pc-7", title: "Data Interpretation (Charts, Graphs, Tables - Class X level)", completed: false },
          { id: "pc-8", title: "English Language Comprehension Skills", completed: false },
        ],
      },
    ],
  },
  {
    id: "mains",
    categoryTitle: "MAINS",
    subjects: [
      {
        id: "m-essay",
        name: "Essay",
        topics: [
          { id: "me-1", title: "Philosophical & Abstract Themes", completed: false },
          { id: "me-2", title: "Socio-Economic & Development Themes", completed: false },
          { id: "me-3", title: "Governance, Democracy & Federalism", completed: false },
          { id: "me-4", title: "Science, AI & Technological Ethics", completed: false },
          { id: "me-5", title: "Environment, Climate & Sustainability", completed: false },
          { id: "me-6", title: "Women Empowerment & Gender Justice", completed: false },
          { id: "me-7", title: "Essay Framework & Multi-dimensional Outline", completed: false },
        ],
      },
      {
        id: "m-gs1",
        name: "GS Paper 1",
        topics: [
          { id: "mg1-1", title: "Indian Culture: Art forms, Literature & Architecture", completed: false },
          { id: "mg1-2", title: "Modern Indian History (Mid-18th century to Present)", completed: false },
          { id: "mg1-3", title: "The Freedom Struggle & Key Contributors", completed: false },
          { id: "mg1-4", title: "Post-independence Consolidation & Reorganization", completed: false },
          { id: "mg1-5", title: "World History (18th-century events, Industrial Revolution, World Wars)", completed: false },
          { id: "mg1-6", title: "Indian Society: Salient Features & Diversity", completed: false },
          { id: "mg1-7", title: "Role of Women & Women's Organizations", completed: false },
          { id: "mg1-8", title: "Population & Associated Issues, Poverty, Urbanization", completed: false },
          { id: "mg1-9", title: "Effects of Globalization on Indian Society", completed: false },
          { id: "mg1-10", title: "Social Empowerment, Communalism, Regionalism & Secularism", completed: false },
          { id: "mg1-11", title: "Salient Features of World's Physical Geography & Distribution of Resources", completed: false },
        ],
      },
      {
        id: "m-gs2",
        name: "GS Paper 2",
        topics: [
          { id: "mg2-1", title: "Indian Constitution: Evolution, Features, Amendments & Basic Structure", completed: false },
          { id: "mg2-2", title: "Functions & Responsibilities of Union and States, Federal Challenges", completed: false },
          { id: "mg2-3", title: "Separation of Powers & Dispute Redressal Mechanisms", completed: false },
          { id: "mg2-4", title: "Comparison of Indian Constitutional Scheme with other countries", completed: false },
          { id: "mg2-5", title: "Parliament & State Legislatures: Structure, Functioning & Conduct", completed: false },
          { id: "mg2-6", title: "Executive & Judiciary: Structure, Ministries & Departments", completed: false },
          { id: "mg2-7", title: "Salient Features of Representation of People's Act", completed: false },
          { id: "mg2-8", title: "Appointment to Constitutional Posts, Powers & Responsibilities", completed: false },
          { id: "mg2-9", title: "Statutory, Regulatory & Quasi-Judicial Bodies", completed: false },
          { id: "mg2-10", title: "Government Policies & Interventions for Development", completed: false },
          { id: "mg2-11", title: "Welfare Schemes for Vulnerable Sections", completed: false },
          { id: "mg2-12", title: "Health, Education, Human Resources & Poverty/Hunger Issues", completed: false },
          { id: "mg2-13", title: "Important Aspects of Governance, Transparency, Accountability & e-Governance", completed: false },
        ],
      },
      {
        id: "m-gs3",
        name: "GS Paper 3",
        topics: [
          { id: "mg3-1", title: "Indian Economy & Planning, Mobilization of Resources, Growth & Employment", completed: false },
          { id: "mg3-2", title: "Inclusive Growth & Issues Arising from It", completed: false },
          { id: "mg3-3", title: "Government Budgeting", completed: false },
          { id: "mg3-4", title: "Major Crops, Cropping Patterns & Irrigation Systems", completed: false },
          { id: "mg3-5", title: "PDS, Buffer Stocks, Food Security & Subsidies", completed: false },
          { id: "mg3-6", title: "Food Processing & Related Industries in India", completed: false },
          { id: "mg3-7", title: "Land Reforms in India", completed: false },
          { id: "mg3-8", title: "Effects of Liberalization on Economy & Industrial Policy Changes", completed: false },
          { id: "mg3-9", title: "Infrastructure: Energy, Ports, Roads, Railways", completed: false },
          { id: "mg3-10", title: "Science & Tech Developments and their Applications in Everyday Life", completed: false },
          { id: "mg3-11", title: "Achievements of Indians in S&T; Indigenization & Technology", completed: false },
          { id: "mg3-12", title: "Awareness in IT, Space, Computers, Robotics, Biotech, Nano-tech", completed: false },
          { id: "mg3-13", title: "Conservation, Environmental Pollution & Degradation, EIA", completed: false },
          { id: "mg3-14", title: "Disaster and Disaster Management", completed: false },
          { id: "mg3-15", title: "Linkages between Development & Spread of Extremism", completed: false },
          { id: "mg3-16", title: "Role of External State and Non-State Actors to Internal Security", completed: false },
          { id: "mg3-17", title: "Challenges to Internal Security via Communication Networks & Cyber Security", completed: false },
          { id: "mg3-18", title: "Security Forces and Agencies and their Mandate", completed: false },
        ],
      },
      {
        id: "m-gs4",
        name: "GS Paper 4",
        topics: [
          { id: "mg4-1", title: "Ethics and Human Interface: Essence, Determinants & Consequences", completed: false },
          { id: "mg4-2", title: "Human Values: Lessons from Leaders, Reformers & Administrators", completed: false },
          { id: "mg4-3", title: "Attitude: Content, Structure, Function & Moral/Political Attitudes", completed: false },
          { id: "mg4-4", title: "Aptitude and Foundational Values for Civil Service", completed: false },
          { id: "mg4-5", title: "Emotional Intelligence: Concepts and Utilities in Governance", completed: false },
          { id: "mg4-6", title: "Contributions of Moral Thinkers and Philosophers", completed: false },
          { id: "mg4-7", title: "Public/Civil Service Values and Ethics in Public Administration", completed: false },
          { id: "mg4-8", title: "Probity in Governance & Case Studies on above issues", completed: false },
        ],
      },
      {
        id: "m-opt1",
        name: "Optional Subject — Paper 1",
        topics: [],
      },
      {
        id: "m-opt2",
        name: "Optional Subject — Paper 2",
        topics: [],
      },
    ],
  },
  {
    id: "mains-qualifying",
    categoryTitle: "MAINS",
    subTitle: "QUALIFYING (NOT COUNTED IN MERIT)",
    subjects: [
      {
        id: "mq-pa",
        name: "Paper A — Compulsory Indian Language",
        topics: [
          { id: "mq-a1", title: "Comprehension of given passages", completed: false },
          { id: "mq-a2", title: "Precis Writing", completed: false },
          { id: "mq-a3", title: "Usage and Vocabulary", completed: false },
          { id: "mq-a4", title: "Short Essays", completed: false },
          { id: "mq-a5", title: "Translation from English to Indian Language and vice-versa", completed: false },
        ],
      },
      {
        id: "mq-pb",
        name: "Paper B — English",
        topics: [
          { id: "mq-b1", title: "Comprehension of given passages", completed: false },
          { id: "mq-b2", title: "Precis Writing", completed: false },
          { id: "mq-b3", title: "Usage and Vocabulary", completed: false },
          { id: "mq-b4", title: "Short Essays", completed: false },
          { id: "mq-b5", title: "Sentence Correction and English Grammar", completed: false },
        ],
      },
    ],
  },
];