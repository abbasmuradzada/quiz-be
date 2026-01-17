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
  console.log('Clearing database...');

  // Delete all data in correct order (respecting foreign keys)
  await prisma.answer.deleteMany();
  await prisma.gamePlayer.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared!');
  console.log('Seeding database...');

  // Create football category
  const footballCategory = await prisma.category.create({
    data: {
      name: 'Futbol',
      slug: 'futbol',
      description: 'Futbol haqqında suallar',
    },
  });

  console.log('Created category: Futbol');

  // Create admin user
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@quiz.com',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Created admin user');

  // Easy questions (30)
  const easyQuestions = [
    { text: 'Futbol komandasında neçə oyunçu olur?', options: ['9', '10', '11', '12'], correct: '11' },
    { text: 'Futbol matçı neçə hissədən ibarətdir?', options: ['1', '2', '3', '4'], correct: '2' },
    { text: 'Futbolda qapıçı hansı rəngli formada oynayır?', options: ['Komanda ilə eyni', 'Fərqli rəngdə', 'Həmişə qara', 'Həmişə ağ'], correct: 'Fərqli rəngdə' },
    { text: 'FIFA dünya çempionatı neçə ildən bir keçirilir?', options: ['2 il', '3 il', '4 il', '5 il'], correct: '4 il' },
    { text: 'Futbol topunun forması necədir?', options: ['Oval', 'Kürə', 'Kvadrat', 'Üçbucaq'], correct: 'Kürə' },
    { text: 'Penalti nöqtəsi qapıdan neçə metr məsafədədir?', options: ['9 metr', '10 metr', '11 metr', '12 metr'], correct: '11 metr' },
    { text: 'Futbolda sarı vərəqə nə deməkdir?', options: ['Qol', 'Xəbərdarlıq', 'Meydandan kənarlaşdırma', 'Oyunun sonu'], correct: 'Xəbərdarlıq' },
    { text: 'Futbolda qırmızı vərəqə nə deməkdir?', options: ['Qol', 'Xəbərdarlıq', 'Meydandan kənarlaşdırma', 'Faul'], correct: 'Meydandan kənarlaşdırma' },
    { text: 'Ofsayd qaydası hansı idman növünə aiddir?', options: ['Basketbol', 'Voleybol', 'Futbol', 'Tennis'], correct: 'Futbol' },
    { text: 'Futbol matçının normal vaxtı neçə dəqiqədir?', options: ['60 dəqiqə', '70 dəqiqə', '80 dəqiqə', '90 dəqiqə'], correct: '90 dəqiqə' },
    { text: 'Hansı ölkə futbolun vətəni sayılır?', options: ['Braziliya', 'İngiltərə', 'İspaniya', 'İtaliya'], correct: 'İngiltərə' },
    { text: 'Futbolda korner nədir?', options: ['Künc zərbəsi', 'Penalti', 'Sərbəst zərbə', 'Aut'], correct: 'Künc zərbəsi' },
    { text: 'Qapıçı əlləri ilə topu tuta bilərmi?', options: ['Bəli, öz cərimə meydançasında', 'Xeyr', 'Bəli, hər yerdə', 'Yalnız kornerdə'], correct: 'Bəli, öz cərimə meydançasında' },
    { text: 'Futbol meydançasının ortasındakı dairənin adı nədir?', options: ['Penalti nöqtəsi', 'Mərkəz dairəsi', 'Korner', 'Aut xətti'], correct: 'Mərkəz dairəsi' },
    { text: 'Het-trik nə deməkdir?', options: ['1 qol vurmaq', '2 qol vurmaq', '3 qol vurmaq', '4 qol vurmaq'], correct: '3 qol vurmaq' },
    { text: 'Avropa çempionatı neçə ildən bir keçirilir?', options: ['2 il', '3 il', '4 il', '5 il'], correct: '4 il' },
    { text: 'Futbolda aut nə zaman verilir?', options: ['Top yan xətti keçəndə', 'Top qapı xəttini keçəndə', 'Faul olanda', 'Ofsayd olanda'], correct: 'Top yan xətti keçəndə' },
    { text: 'Hansı oyunçu meydanda əlindən istifadə edə bilər?', options: ['Hücumçu', 'Müdafiəçi', 'Yarımmüdafiəçi', 'Qapıçı'], correct: 'Qapıçı' },
    { text: 'Dünya Kuboku hansı təşkilat tərəfindən keçirilir?', options: ['UEFA', 'FIFA', 'AFFA', 'IOC'], correct: 'FIFA' },
    { text: 'Futbol meydançası hansı formadadır?', options: ['Dairəvi', 'Kvadrat', 'Düzbucaqlı', 'Üçbucaq'], correct: 'Düzbucaqlı' },
    { text: 'Çempionlar Liqası hansı təşkilat tərəfindən keçirilir?', options: ['FIFA', 'UEFA', 'AFFA', 'CONMEBOL'], correct: 'UEFA' },
    { text: 'Futbolda neçə hakim olur?', options: ['1', '2', '3', '4'], correct: '4' },
    { text: 'Matçda əlavə vaxt neçə dəqiqə ola bilər?', options: ['15+15', '20+20', '30+30', '10+10'], correct: '15+15' },
    { text: 'Futbol topunun içində nə var?', options: ['Su', 'Qum', 'Hava', 'Plastik'], correct: 'Hava' },
    { text: 'Qol vurulanda top harada olmalıdır?', options: ['Qapı xəttini tam keçməlidir', 'Xəttə toxunmalıdır', 'Yarıdan çox keçməlidir', 'Qapının içində'], correct: 'Qapı xəttini tam keçməlidir' },
    { text: 'Futbolda "dərbi" nə deməkdir?', options: ['Final matçı', 'Şəhər rəqibləri arasında oyun', 'Yoldaşlıq oyunu', 'Kubok oyunu'], correct: 'Şəhər rəqibləri arasında oyun' },
    { text: 'VAR nədir?', options: ['Video Hakim Sistemi', 'Oyunçu adı', 'Turnir adı', 'Stadion adı'], correct: 'Video Hakim Sistemi' },
    { text: 'Futbolda hansı bədən hissəsi ilə oynamaq olmaz?', options: ['Baş', 'Sinə', 'Əl', 'Ayaq'], correct: 'Əl' },
    { text: 'Azərbaycan millisinin forma rəngi nədir?', options: ['Qırmızı-ağ', 'Mavi-ağ', 'Yaşıl-ağ', 'Qara-ağ'], correct: 'Mavi-ağ' },
    { text: 'Futbolda "kapitan" kimin adıdır?', options: ['Baş məşqçi', 'Komanda lideri', 'Hakim', 'Heyət üzvü'], correct: 'Komanda lideri' },
  ];

  // Medium questions (30)
  const mediumQuestions = [
    { text: '2022 Dünya Kubokunu hansı ölkə qazandı?', options: ['Braziliya', 'Fransa', 'Argentina', 'Xorvatiya'], correct: 'Argentina' },
    { text: 'Lionel Messi hansı ölkənin vətəndaşıdır?', options: ['Braziliya', 'Portuqaliya', 'Argentina', 'İspaniya'], correct: 'Argentina' },
    { text: 'Cristiano Ronaldo hansı ölkədəndir?', options: ['Braziliya', 'Portuqaliya', 'İspaniya', 'İtaliya'], correct: 'Portuqaliya' },
    { text: 'Barcelona klubu hansı şəhərdədir?', options: ['Madrid', 'Barselona', 'Lissabon', 'Roma'], correct: 'Barselona' },
    { text: 'Real Madrid neçənci ildə yaradılıb?', options: ['1900', '1902', '1905', '1910'], correct: '1902' },
    { text: 'Premier Liqa hansı ölkənin liqasıdır?', options: ['İspaniya', 'İtaliya', 'İngiltərə', 'Almaniya'], correct: 'İngiltərə' },
    { text: 'La Liqa hansı ölkənin liqasıdır?', options: ['İspaniya', 'İtaliya', 'Fransa', 'Portuqaliya'], correct: 'İspaniya' },
    { text: 'Serie A hansı ölkənin liqasıdır?', options: ['İspaniya', 'İtaliya', 'Fransa', 'Almaniya'], correct: 'İtaliya' },
    { text: 'Bundesliga hansı ölkənin liqasıdır?', options: ['Avstriya', 'İsveçrə', 'Almaniya', 'Hollandiya'], correct: 'Almaniya' },
    { text: 'Neymar hansı ölkədəndir?', options: ['Argentina', 'Braziliya', 'Kolumbiya', 'Uruqvay'], correct: 'Braziliya' },
    { text: 'Dünya Kuboklarında ən çox qol vuran oyunçu kimdir?', options: ['Pele', 'Ronaldo', 'Miroslav Klose', 'Messi'], correct: 'Miroslav Klose' },
    { text: 'Hansı klub ən çox Çempionlar Liqası qazanıb?', options: ['Barcelona', 'Milan', 'Real Madrid', 'Liverpool'], correct: 'Real Madrid' },
    { text: 'Manchester United hansı şəhərdədir?', options: ['London', 'Mançester', 'Liverpool', 'Birmingham'], correct: 'Mançester' },
    { text: '2018 Dünya Kuboku harada keçirilib?', options: ['Braziliya', 'Rusiya', 'Qətər', 'Almaniya'], correct: 'Rusiya' },
    { text: 'Maradona hansı ölkədən idi?', options: ['Braziliya', 'Argentina', 'Uruqvay', 'Çili'], correct: 'Argentina' },
    { text: 'Camp Nou hansı klubun stadionudur?', options: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla'], correct: 'Barcelona' },
    { text: 'Old Trafford hansı klubun stadionudur?', options: ['Liverpool', 'Arsenal', 'Manchester United', 'Chelsea'], correct: 'Manchester United' },
    { text: 'Pele neçə Dünya Kuboku qazanıb?', options: ['1', '2', '3', '4'], correct: '3' },
    { text: 'Hansı ölkə ən çox Dünya Kuboku qazanıb?', options: ['Almaniya', 'İtaliya', 'Braziliya', 'Argentina'], correct: 'Braziliya' },
    { text: 'Qızıl top mükafatı nəyə görə verilir?', options: ['Ən yaxşı qapıçıya', 'Ən yaxşı oyunçuya', 'Ən yaxşı məşqçiyə', 'Ən yaxşı kluba'], correct: 'Ən yaxşı oyunçuya' },
    { text: 'Zinedine Zidane hansı ölkədəndir?', options: ['İtaliya', 'İspaniya', 'Fransa', 'Portuqaliya'], correct: 'Fransa' },
    { text: 'Liverpool hansı şəhərdədir?', options: ['London', 'Mançester', 'Liverpool', 'Birmingham'], correct: 'Liverpool' },
    { text: 'Bayern Münhen hansı ölkədəndir?', options: ['Avstriya', 'Almaniya', 'İsveçrə', 'Hollandiya'], correct: 'Almaniya' },
    { text: 'PSG hansı şəhərdədir?', options: ['London', 'Madrid', 'Paris', 'Roma'], correct: 'Paris' },
    { text: 'Juventus hansı şəhərdədir?', options: ['Milan', 'Roma', 'Turin', 'Neapol'], correct: 'Turin' },
    { text: 'Luka Modric hansı ölkədəndir?', options: ['Serbiya', 'Xorvatiya', 'Sloveniya', 'Bosniya'], correct: 'Xorvatiya' },
    { text: 'Kylian Mbappe hansı ölkədəndir?', options: ['Belçika', 'Fransa', 'Senegal', 'Kamerun'], correct: 'Fransa' },
    { text: 'Santiago Bernabeu hansı klubun stadionudur?', options: ['Barcelona', 'Real Madrid', 'Atletico Madrid', 'Valencia'], correct: 'Real Madrid' },
    { text: 'Erling Haaland hansı ölkədəndir?', options: ['İsveç', 'Danimarka', 'Norveç', 'Finlandiya'], correct: 'Norveç' },
    { text: 'Chelsea hansı şəhərdədir?', options: ['Mançester', 'London', 'Liverpool', 'Leeds'], correct: 'London' },
  ];

  // Hard questions (30)
  const hardQuestions = [
    { text: '1930-cu ildə ilk Dünya Kubokunu hansı ölkə qazandı?', options: ['Braziliya', 'Argentina', 'Uruqvay', 'İtaliya'], correct: 'Uruqvay' },
    { text: 'Hansı oyunçu 5 dəfə Qızıl top qazanıb (Messi və Ronaldodan başqa)?', options: ['Cruyff', 'Platini', 'Beckenbauer', 'Heç kim'], correct: 'Heç kim' },
    { text: 'Ajax hansı şəhərdədir?', options: ['Rotterdam', 'Amsterdam', 'Haaqa', 'Eyndxoven'], correct: 'Amsterdam' },
    { text: '2006 Dünya Kuboku finalında Zidane kimə kafa vurdu?', options: ['Buffon', 'Cannavaro', 'Materazzi', 'Pirlo'], correct: 'Materazzi' },
    { text: 'Hansı klub "Treble" (üçlük) qazanan ilk İngilis klubudur?', options: ['Liverpool', 'Chelsea', 'Manchester United', 'Arsenal'], correct: 'Manchester United' },
    { text: 'Sir Alex Ferguson Manchester Unitedda neçə il çalışıb?', options: ['20 il', '23 il', '26 il', '30 il'], correct: '26 il' },
    { text: 'Marakanə stadionu hansı şəhərdədir?', options: ['San Paulo', 'Rio de Janeyro', 'Buenos Ayres', 'Lima'], correct: 'Rio de Janeyro' },
    { text: 'Hansı oyunçu bir Dünya Kubokunda ən çox qol vurub?', options: ['Pele', 'Just Fontaine', 'Gerd Müller', 'Ronaldo'], correct: 'Just Fontaine' },
    { text: 'Johan Cruyff hansı ölkədən idi?', options: ['Belçika', 'Almaniya', 'Hollandiya', 'Danimarka'], correct: 'Hollandiya' },
    { text: 'Hansı klub "Galacticos" adı ilə tanınır?', options: ['Barcelona', 'Real Madrid', 'Manchester United', 'Bayern'], correct: 'Real Madrid' },
    { text: '1994 Dünya Kuboku finalında penalti buraxan Braziliyalı kimdir?', options: ['Romario', 'Bebeto', 'Roberto Baggio', 'Dunga'], correct: 'Roberto Baggio' },
    { text: 'Wembley stadionu hansı şəhərdədir?', options: ['Mançester', 'Liverpool', 'London', 'Birmingham'], correct: 'London' },
    { text: 'Hansı ölkə 2002 Dünya Kubokuna ev sahibliyi etdi?', options: ['Yaponiya', 'Cənubi Koreya', 'Yaponiya və C.Koreya', 'Çin'], correct: 'Yaponiya və C.Koreya' },
    { text: 'Ferenc Puskas hansı ölkədən idi?', options: ['Polşa', 'Çexiya', 'Macarıstan', 'Rumıniya'], correct: 'Macarıstan' },
    { text: 'Hansı klub ən çox La Liqa çempionluğu qazanıb?', options: ['Barcelona', 'Real Madrid', 'Atletico Madrid', 'Valencia'], correct: 'Real Madrid' },
    { text: 'İlk Qızıl top qazanan oyunçu kimdir?', options: ['Pele', 'Di Stefano', 'Stanley Matthews', 'Puskas'], correct: 'Stanley Matthews' },
    { text: 'Hansı oyunçu "O Fenomeno" ləqəbi ilə tanınır?', options: ['Ronaldinho', 'Ronaldo Nazario', 'Rivaldo', 'Romario'], correct: 'Ronaldo Nazario' },
    { text: 'AC Milan neçənci ildə yaradılıb?', options: ['1899', '1902', '1905', '1910'], correct: '1899' },
    { text: '2010 Dünya Kuboku hansı ölkədə keçirilib?', options: ['Braziliya', 'Almaniya', 'Cənubi Afrika', 'Rusiya'], correct: 'Cənubi Afrika' },
    { text: 'Hansı oyunçu ən çox Çempionlar Liqası qazanıb?', options: ['Messi', 'Ronaldo', 'Paco Gento', 'Maldini'], correct: 'Paco Gento' },
    { text: 'Borussia Dortmundun stadionu necə adlanır?', options: ['Allianz Arena', 'Signal Iduna Park', 'Olympiastadion', 'Veltins Arena'], correct: 'Signal Iduna Park' },
    { text: 'Hansı ölkə 3 dəfə ardıcıl Avropa çempionu olub?', options: ['Almaniya', 'Fransa', 'İspaniya', 'Heç biri'], correct: 'İspaniya' },
    { text: 'Alfredo Di Stefano hansı ölkələrin millisində oynayıb?', options: ['Argentina', 'İspaniya', 'Kolumbiya', 'Hamısı'], correct: 'Hamısı' },
    { text: 'Hansı məşqçi ən çox Çempionlar Liqası qazanıb?', options: ['Guardiola', 'Ancelotti', 'Ferguson', 'Mourinho'], correct: 'Ancelotti' },
    { text: '1950 Dünya Kuboku finalında Braziliyanı hansı ölkə məğlub etdi?', options: ['Argentina', 'Uruqvay', 'İsveç', 'Almaniya'], correct: 'Uruqvay' },
    { text: 'San Siro stadionu hansı klubların evidir?', options: ['Juventus və Torino', 'Roma və Lazio', 'Milan və Inter', 'Napoli və Salernitana'], correct: 'Milan və Inter' },
    { text: 'Hansı oyunçu "Qara İnci" ləqəbi ilə tanınırdı?', options: ['Pele', 'Eusebio', 'Maradona', 'Garrincha'], correct: 'Eusebio' },
    { text: 'Tottenham Hotspur hansı ildə Çempionlar Liqası finalına çıxdı?', options: ['2017', '2018', '2019', '2020'], correct: '2019' },
    { text: 'Bobby Charlton hansı klubda oynayırdı?', options: ['Liverpool', 'Manchester United', 'Chelsea', 'Arsenal'], correct: 'Manchester United' },
    { text: 'Hansı ölkə 1954 Dünya Kubokunu qazandı?', options: ['Macarıstan', 'Braziliya', 'Almaniya', 'Uruqvay'], correct: 'Almaniya' },
  ];

  // Create Easy Quiz
  const easyQuiz = await prisma.quiz.create({
    data: {
      title: 'Futbol - Asan Səviyyə',
      description: 'Futbol haqqında asan suallar',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.EASY,
      timeLimit: 600,
      categoryId: footballCategory.id,
      authorId: adminUser.id,
      questions: {
        create: easyQuestions.map((q, index) => ({
          type: QuestionType.SINGLE_CHOICE,
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correct,
          points: 10,
          timeLimit: 30,
          order: index + 1,
        })),
      },
    },
  });

  console.log(`Created quiz: ${easyQuiz.title} (30 questions)`);

  // Create Medium Quiz
  const mediumQuiz = await prisma.quiz.create({
    data: {
      title: 'Futbol - Orta Səviyyə',
      description: 'Futbol haqqında orta çətinlikdə suallar',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.MEDIUM,
      timeLimit: 600,
      categoryId: footballCategory.id,
      authorId: adminUser.id,
      questions: {
        create: mediumQuestions.map((q, index) => ({
          type: QuestionType.SINGLE_CHOICE,
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correct,
          points: 15,
          timeLimit: 30,
          order: index + 1,
        })),
      },
    },
  });

  console.log(`Created quiz: ${mediumQuiz.title} (30 questions)`);

  // Create Hard Quiz
  const hardQuiz = await prisma.quiz.create({
    data: {
      title: 'Futbol - Çətin Səviyyə',
      description: 'Futbol haqqında çətin suallar',
      visibility: QuizVisibility.PUBLIC,
      difficulty: Difficulty.HARD,
      timeLimit: 600,
      categoryId: footballCategory.id,
      authorId: adminUser.id,
      questions: {
        create: hardQuestions.map((q, index) => ({
          type: QuestionType.SINGLE_CHOICE,
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correct,
          points: 20,
          timeLimit: 30,
          order: index + 1,
        })),
      },
    },
  });

  console.log(`Created quiz: ${hardQuiz.title} (30 questions)`);

  // Count totals
  const questionCount = await prisma.question.count();

  console.log('\nSeeding completed!');
  console.log(`Total questions: ${questionCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
