import 'dotenv/config';
import { PrismaClient, QuestionType, Difficulty, QuizVisibility, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'science' },
      update: {},
      create: {
        name: 'Science',
        slug: 'science',
        description: 'Questions about physics, chemistry, biology, and more',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'history' },
      update: {},
      create: {
        name: 'History',
        slug: 'history',
        description: 'Questions about world history and historical events',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'geography' },
      update: {},
      create: {
        name: 'Geography',
        slug: 'geography',
        description: 'Questions about countries, capitals, and landmarks',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
        description: 'Questions about computers, programming, and tech',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Sports',
        slug: 'sports',
        description: 'Questions about various sports and athletes',
      },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create a seed user
  const passwordHash = await bcrypt.hash('password123', 10);
  const seedUser = await prisma.user.upsert({
    where: { email: 'admin@quiz.com' },
    update: {},
    create: {
      email: 'admin@quiz.com',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Created seed user: ${seedUser.username}`);

  // Create quizzes with questions
  const scienceQuiz = await prisma.quiz.create({
    data: {
      title: 'General Science Quiz',
      description: 'Test your knowledge of basic science concepts',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.MEDIUM,
      timeLimit: 300,
      categoryId: categories[0].id,
      authorId: seedUser.id,
      questions: {
        create: [
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What is the chemical symbol for water?',
            options: JSON.stringify(['H2O', 'CO2', 'NaCl', 'O2']),
            correctAnswer: 'H2O',
            points: 10,
            timeLimit: 30,
            order: 1,
            explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What planet is known as the Red Planet?',
            options: JSON.stringify(['Venus', 'Mars', 'Jupiter', 'Saturn']),
            correctAnswer: 'Mars',
            points: 10,
            timeLimit: 30,
            order: 2,
            explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
          },
          {
            type: QuestionType.TRUE_FALSE,
            text: 'The speed of light is approximately 300,000 km/s.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
            points: 10,
            timeLimit: 20,
            order: 3,
            explanation: 'Light travels at approximately 299,792 km/s in a vacuum.',
          },
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Which of the following are noble gases?',
            options: JSON.stringify(['Helium', 'Nitrogen', 'Neon', 'Argon']),
            correctAnswer: JSON.stringify(['Helium', 'Neon', 'Argon']),
            points: 15,
            timeLimit: 45,
            order: 4,
            explanation: 'Noble gases are in Group 18 of the periodic table.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What is the powerhouse of the cell?',
            options: JSON.stringify(['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus']),
            correctAnswer: 'Mitochondria',
            points: 10,
            timeLimit: 30,
            order: 5,
            explanation: 'Mitochondria produce ATP, the energy currency of cells.',
          },
        ],
      },
    },
  });

  console.log(`Created quiz: ${scienceQuiz.title}`);

  const historyQuiz = await prisma.quiz.create({
    data: {
      title: 'World History Challenge',
      description: 'How well do you know world history?',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.HARD,
      timeLimit: 600,
      categoryId: categories[1].id,
      authorId: seedUser.id,
      questions: {
        create: [
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'In what year did World War II end?',
            options: JSON.stringify(['1943', '1944', '1945', '1946']),
            correctAnswer: '1945',
            points: 10,
            timeLimit: 30,
            order: 1,
            explanation: 'WWII ended in 1945 with the surrender of Japan.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Who was the first President of the United States?',
            options: JSON.stringify(['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin']),
            correctAnswer: 'George Washington',
            points: 10,
            timeLimit: 30,
            order: 2,
            explanation: 'George Washington served as president from 1789 to 1797.',
          },
          {
            type: QuestionType.TRUE_FALSE,
            text: 'The Great Wall of China is visible from space with the naked eye.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'False',
            points: 10,
            timeLimit: 20,
            order: 3,
            explanation: 'This is a common myth. The wall is not visible from space without aid.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Which ancient civilization built the pyramids of Giza?',
            options: JSON.stringify(['Romans', 'Greeks', 'Egyptians', 'Mesopotamians']),
            correctAnswer: 'Egyptians',
            points: 10,
            timeLimit: 30,
            order: 4,
            explanation: 'The pyramids were built as tombs for Egyptian pharaohs.',
          },
          {
            type: QuestionType.TEXT_INPUT,
            text: 'What year did the Titanic sink?',
            options: Prisma.JsonNull,
            correctAnswer: '1912',
            points: 15,
            timeLimit: 45,
            order: 5,
            explanation: 'The Titanic sank on April 15, 1912.',
          },
        ],
      },
    },
  });

  console.log(`Created quiz: ${historyQuiz.title}`);

  const techQuiz = await prisma.quiz.create({
    data: {
      title: 'Programming Fundamentals',
      description: 'Test your programming knowledge',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.EASY,
      timeLimit: 300,
      categoryId: categories[3].id,
      authorId: seedUser.id,
      questions: {
        create: [
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What does HTML stand for?',
            options: JSON.stringify([
              'Hyper Text Markup Language',
              'High Tech Modern Language',
              'Hyper Transfer Markup Language',
              'Home Tool Markup Language',
            ]),
            correctAnswer: 'Hyper Text Markup Language',
            points: 10,
            timeLimit: 30,
            order: 1,
            explanation: 'HTML is the standard markup language for creating web pages.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Which programming language is known for its use in data science?',
            options: JSON.stringify(['Java', 'Python', 'C++', 'Ruby']),
            correctAnswer: 'Python',
            points: 10,
            timeLimit: 30,
            order: 2,
            explanation: 'Python is widely used in data science due to libraries like pandas and numpy.',
          },
          {
            type: QuestionType.TRUE_FALSE,
            text: 'JavaScript and Java are the same programming language.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'False',
            points: 10,
            timeLimit: 20,
            order: 3,
            explanation: 'Despite similar names, they are completely different languages.',
          },
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Which of the following are JavaScript frameworks/libraries?',
            options: JSON.stringify(['React', 'Django', 'Vue', 'Angular']),
            correctAnswer: JSON.stringify(['React', 'Vue', 'Angular']),
            points: 15,
            timeLimit: 45,
            order: 4,
            explanation: 'Django is a Python framework, while the others are JavaScript.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What does CSS stand for?',
            options: JSON.stringify([
              'Computer Style Sheets',
              'Cascading Style Sheets',
              'Creative Style System',
              'Colorful Style Sheets',
            ]),
            correctAnswer: 'Cascading Style Sheets',
            points: 10,
            timeLimit: 30,
            order: 5,
            explanation: 'CSS is used for styling and layout of web pages.',
          },
        ],
      },
    },
  });

  console.log(`Created quiz: ${techQuiz.title}`);

  const geographyQuiz = await prisma.quiz.create({
    data: {
      title: 'World Geography',
      description: 'Explore the world through this geography quiz',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.MEDIUM,
      timeLimit: 400,
      categoryId: categories[2].id,
      authorId: seedUser.id,
      questions: {
        create: [
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'What is the capital of Australia?',
            options: JSON.stringify(['Sydney', 'Melbourne', 'Canberra', 'Perth']),
            correctAnswer: 'Canberra',
            points: 10,
            timeLimit: 30,
            order: 1,
            explanation: 'Canberra is the capital, though Sydney is the largest city.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Which is the longest river in the world?',
            options: JSON.stringify(['Amazon', 'Nile', 'Yangtze', 'Mississippi']),
            correctAnswer: 'Nile',
            points: 10,
            timeLimit: 30,
            order: 2,
            explanation: 'The Nile River is approximately 6,650 km long.',
          },
          {
            type: QuestionType.TRUE_FALSE,
            text: 'Mount Everest is located in the Himalayas.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
            points: 10,
            timeLimit: 20,
            order: 3,
            explanation: 'Mount Everest sits on the border of Nepal and Tibet in the Himalayas.',
          },
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Which country has the largest population?',
            options: JSON.stringify(['India', 'United States', 'China', 'Indonesia']),
            correctAnswer: 'India',
            points: 10,
            timeLimit: 30,
            order: 4,
            explanation: 'India surpassed China as the most populous country in 2023.',
          },
          {
            type: QuestionType.TEXT_INPUT,
            text: 'How many continents are there on Earth?',
            options: Prisma.JsonNull,
            correctAnswer: '7',
            points: 10,
            timeLimit: 30,
            order: 5,
            explanation: 'The 7 continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America.',
          },
        ],
      },
    },
  });

  console.log(`Created quiz: ${geographyQuiz.title}`);

  // Count totals
  const quizCount = await prisma.quiz.count();
  const questionCount = await prisma.question.count();

  console.log('\nSeeding completed!');
  console.log(`Total quizzes: ${quizCount}`);
  console.log(`Total questions: ${questionCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
