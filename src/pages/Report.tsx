
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Users, Brain, Target, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Report = () => {
  const navigate = useNavigate();

  const keyStats = [
    { icon: TrendingDown, value: "85%", label: "of global workers report disengagement at work", color: "text-red-500" },
    { icon: Users, value: "40%", label: "of 15-year-old students have no clear career plans", color: "text-orange-500" },
    { icon: Brain, value: "50%", label: "of employees will require reskilling by 2025", color: "text-blue-500" },
    { icon: Target, value: "202%", label: "higher performance in companies with satisfied employees", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-atlas py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Pervasive Challenge of Career Uncertainty in Today's Workforce
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl">
            A comprehensive analysis of widespread career dissatisfaction and the urgent need for effective career guidance in our rapidly evolving labor market.
          </p>
        </div>
      </div>

      {/* Key Statistics Visual */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container-atlas">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyStats.map((stat, index) => (
              <Card key={index} className="text-center bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className={`mx-auto p-3 rounded-full bg-gray-50 w-fit ${stat.color}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-atlas py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              The contemporary labor market is marked by widespread career uncertainty and dissatisfaction, affecting professionals from their foundational years through their peak careers. This pervasive challenge arises from a complex interplay of factors, including:
            </p>
            <ul className="text-lg text-gray-700 leading-relaxed mb-6 list-disc pl-6">
              <li>A fundamental lack of alignment between personal aspirations and professional realities</li>
              <li>The transformative influence of artificial intelligence (AI)</li>
              <li>Significant deficiencies in organizational support and career development structures</li>
            </ul>
            <p className="text-lg text-gray-700 leading-relaxed">
              The consequences are tangible, manifesting as increased stress, diminished well-being, and reduced productivity across the workforce. This report underscores the urgent need for effective career guidance, highlighting its critical role in navigating a dynamic labor market.
            </p>
          </div>

          {/* Section: The Scale of Discontent */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">The Scale of Discontent: A Global Perspective</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                Career uncertainty isn't an isolated issue but a systemic challenge impacting individuals globally. Even among young professionals, a significant proportion face profound uncertainty about their future paths. Data from PISA 2022 reveals that two in five (40%) students aged 15 across OECD countries have no clear career plans, a figure that has grown by over 50% since 2018 <a href="https://www.oecd.org/en/publications/teenage-career-uncertainty_e89c3da9-en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[1]</a>. This early indecision can lead to long-term economic repercussions, with studies suggesting youth with uncertain career ambitions may earn significantly lower hourly wages in young adulthood <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4273913/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[2]</a>.
              </p>
              
              <p className="mb-4">
                The challenge extends significantly into adulthood, manifesting as widespread job dissatisfaction and profound regret. Key statistics include:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>A staggering 85% of global workers report disengagement at work, with only 15% actively engaged <a href="https://www.talenlio.com/blog/i-hate-my-job-the-silent-epidemic-affecting-85-of-global-workers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[5]</a></li>
                <li>In the U.S., engagement fell to 31% in 2024, its lowest level in a decade <a href="https://www.gallup.com/workplace/654911/employee-engagement-sinks-year-low.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[6]</a></li>
                <li>This decline is particularly pronounced among younger workers</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section: The Core Problem */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">The Core Problem: Misalignment and Disruption</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                The pervasive dissatisfaction among professionals often stems from a fundamental misalignment between personal values and professional reality. When personal and company values align, it demonstrably leads to:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>Increased job satisfaction</li>
                <li>Greater loyalty</li>
                <li>Enhanced motivation and engagement</li>
              </ul>
              
              <p className="mb-4">
                Conversely, such misalignment results in decreased motivation, increased turnover, and hindered contribution <a href="https://interact-global.co/personal-values-vs-company-values-alignment/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[15]</a>. Many individuals struggle to define what they truly want from a career, often prioritizing external validation over intrinsic fulfillment <a href="https://www.talenlio.com/blog/i-hate-my-job-the-silent-epidemic-affecting-85-of-global-workers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[5]</a>, <a href="https://www.bklynresumestudio.com/why-70-of-people-are-unhappy-with-their-careers/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[16]</a>.
              </p>
              
              <p>
                This "personal-professional alignment gap" is a primary driver of career uncertainty, suggesting that the challenge is not just finding a job, but the right job that resonates deeply with an individual's core being.
              </p>
            </CardContent>
          </Card>

          {/* Section: AI Impact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Navigating Disruption: The Impact of AI and Evolving Skill Demands</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                Technological advancements, particularly the rapid rise of artificial intelligence, are fundamentally reshaping the job market and significantly contributing to career uncertainty. The World Economic Forum projects that a staggering 50% of all employees will require reskilling by 2025 due to the widespread adoption of technology <a href="https://www.psychologytoday.com/us/blog/psychological-trauma-coping-and-resilience/202411/navigating-career-uncertainty-the-role-of" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[17]</a>.
              </p>
              
              <p className="mb-4">
                A significant portion of the workforce expresses considerable anxiety about AI's impact on their livelihoods:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>52% of U.S. workers are worried about the future impact of AI in the workplace</li>
                <li>32% believe AI will lead to fewer job opportunities for them in the long run <a href="https://www.pewresearch.org/social-trends/2025/02/25/u-s-workers-are-more-worried-than-hopeful-about-future-ai-use-in-the-workplace/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[18]</a></li>
              </ul>
              
              <p className="mb-4">
                AI is also shrinking traditional entry-level roles, creating an "experience gap" that limits opportunities for new hires to gain practical skills <a href="https://www.deloitte.com/ro/en/about/press-room/studiu-deloitte-doua-treimi-dintre-companii-invoca-lipsa-de-experienta-noilor-angajati-timp-ce-posturile-de-incepatori-sunt-preluate-de-inteligenta-artificiala-stimularea-abilitatilor-umane-devine-prioritara.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[19]</a>, <a href="https://www2.deloitte.com/us/en/pages/about-deloitte/articles/press-releases/deloitte-report-aims-to-help-leaders-navigate-complex-workplace-tensions.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[20]</a>. This necessitates proactive career guidance that anticipates future skill demands rather than merely reacting to current ones.
              </p>
              
              <p className="mb-4">
                The demand for skills is evolving rapidly, with 39% of existing skill sets projected to transform or become outdated by 2030 <a href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[21]</a>. "Human skills" are increasingly valued in an AI-driven environment, including:
              </p>
              
              <ul className="list-disc pl-6">
                <li>Analytical thinking</li>
                <li>Resilience</li>
                <li>Creative thinking <a href="https://www.deloitte.com/ro/en/about/press-room/studiu-deloitte-doua-treimi-dintre-companii-invoca-lipsa-de-experienta-noilor-angajati-timp-ce-posturile-de-incepatori-sunt-preluate-de-inteligenta-artificiala-stimularea-abilitatilor-umane-devine-prioritara.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[19]</a>, <a href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[21]</a></li>
              </ul>
            </CardContent>
          </Card>

          {/* Section: Organizational Imperative */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Organizational Imperative: Gaps and Consequences</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                Beyond individual factors and technological shifts, significant organizational shortcomings contribute substantially to career mismatch and employee turnover. A striking 75% of individuals who left their jobs did so because of their boss, not the position itself, pointing directly to issues with management and leadership <a href="https://www.talenlio.com/blog/i-hate-my-job-the-silent-epidemic-affecting-85-of-global-workers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[5]</a>.
              </p>
              
              <p className="mb-4">
                Data from large economies indicates a decline in employees feeling supported. In the U.S., for example:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>Fewer employees report feeling that someone at work cares about them (down to 39% from 47% in 2020)</li>
                <li>Fewer feel someone encourages their development (down to 30% from 36%) <a href="https://www.gallup.com/workplace/654911/employee-engagement-sinks-year-low.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[6]</a></li>
              </ul>
              
              <p className="mb-4">
                Managers often spend nearly 40% of their time on problem-solving and administrative tasks, with only 13% dedicated to developing their team members <a href="https://www.deloitte.com/ro/en/about/press-room/studiu-deloitte-doua-treimi-dintre-companii-invoca-lipsa-de-experienta-noilor-angajati-timp-ce-posturile-de-incepatori-sunt-preluate-de-inteligenta-artificiala-stimularea-abilitatilor-umane-devine-prioritara.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[19]</a>, <a href="https://www2.deloitte.com/us/en/pages/about-deloitte/articles/press-releases/deloitte-report-aims-to-help-leaders-navigate-complex-workplace-tensions.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[20]</a>.
              </p>
              
              <p className="mb-4">Despite the critical need, organizational investment in robust career development programs remains insufficient:</p>
              <ul className="mb-4 list-disc pl-6">
                <li>Only 36% of organizations are categorized as "career development champions" with comprehensive programs <a href="https://learning.linkedin.com/content/dam/me/learning/en-us/images/lls-workplace-learning-report/2025/full-page/pdfs/LinkedIn-Workplace-Learning-Report-2025.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[22]</a></li>
                <li>31% have limited adoption, and a substantial 33% have no initiatives at all <a href="https://learning.linkedin.com/content/dam/me/learning/en-us/images/lls-workplace-learning-report/2025/full-page/pdfs/LinkedIn-Workplace-Learning-Report-2025.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[22]</a></li>
              </ul>
              
              <p>
                This creates a massive void in employee support, leaving many workers unaware of how to advance their careers within their current organizations. Consequently, one in three employees leave their previous job due to a perceived lack of career development opportunities or because another company offered better prospects <a href="https://info.recruitics.com/blog/career-pathing-and-employee-retention" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[14]</a>.
              </p>
            </CardContent>
          </Card>

          {/* Section: Tangible Impact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">The Tangible Impact: Mental Health, Productivity, and Engagement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                Career uncertainty and job insecurity exert a profound negative impact on mental health and overall well-being. According to the APA's 2025 Work in America™ survey, job insecurity significantly impacts the stress levels of 54% of U.S. workers <a href="https://www.apa.org/pubs/reports/work-in-america/2025" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[23]</a>. This stress and anxiety can significantly impact overall mental health, workplace productivity, and morale <a href="https://headington-institute.org/blog/resource/10-tips-managing-wellbeing-career-uncertainty/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[24]</a>.
              </p>
              
              <p className="mb-4">Beyond individual well-being, career uncertainty and dissatisfaction have tangible negative impacts on organizational performance and economic productivity. Research consistently demonstrates a direct correlation between employee satisfaction and organizational performance:</p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>Companies with higher employee satisfaction rates significantly outperform those with low satisfaction levels by a remarkable 202% <a href="https://elearningindustry.com/job-satisfaction-statistics-key-data-and-insights" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[26]</a></li>
                <li>When employees feel a sense of fulfillment at work, they are 87% less likely to leave the organization <a href="https://elearningindustry.com/job-satisfaction-statistics-key-data-and-insights" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[26]</a></li>
                <li>Engaged employees also contribute to a 65% lower employee turnover rate <a href="https://elearningindustry.com/job-satisfaction-statistics-key-data-and-insights" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[26]</a></li>
                <li>A positive mindset can lead to less absenteeism and a 60% boost in job satisfaction <a href="https://elearningindustry.com/job-satisfaction-statistics-key-data-and-insights" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[26]</a></li>
              </ul>
              
              <p>
                The ongoing decline in employee engagement therefore signals potential vulnerabilities for businesses, directly impacting their bottom line. Addressing career uncertainty and fostering job satisfaction isn't merely a human resources concern but a critical economic imperative for businesses.
              </p>
            </CardContent>
          </Card>

          {/* Section: Growing Need */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">The Growing Need for Effective Career Guidance</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                The growing market for professional career support reflects a clear and increasing societal need. The Job Training & Career Counseling industry in the U.S. had a market size of $17.8 billion in 2024, experiencing a 1.3% growth rate <a href="https://www.ibisworld.com/united-states/market-size/job-training-career-counseling/1616/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[27]</a>. Within career services, there's a clear and pronounced shift towards coaching. A 2016-17 NACE report found that career coaching is the primary focus (81%) for career development interaction with students, with expected growth <a href="https://www.naceweb.org/career-development/organizational-structure/primary-focus-career-coaching-vs-career-counseling/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[28]</a>. This indicates a strong preference for proactive, solution-oriented guidance.
              </p>
              
              <p>
                Despite this evident market growth and need, organizational investment in internal career development remains significantly insufficient, creating a massive gap between employee needs and employer provision of career support. This significant organizational gap highlights a massive unmet demand, suggesting a robust external market for comprehensive support.
              </p>
            </CardContent>
          </Card>

          {/* Section: Efficacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">The Efficacy of Professional Career Interventions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                Evidence strongly supports the effectiveness of professional career interventions in reducing uncertainty and improving career outcomes. Programs of career development are consistently shown to reduce levels of career uncertainty <a href="https://www.oecd.org/en/publications/teenage-career-uncertainty_e89c3da9-en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[1]</a>. For young people, career advice has been correlated with lower levels of uncertainty, suggesting that appropriate and personalized guidance can significantly impact career aspirations <a href="https://www.educationandemployers.org/research/uncertainty-in-educational-and-career-aspirations-gender-differences-in-young-people/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[3]</a>.
              </p>
              
              <p className="mb-4">
                The concept of "career pathing," which provides clarity on attainable objectives, is demonstrably shown to increase employee retention <a href="https://info.recruitics.com/blog/career-pathing-and-employee-retention" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[14]</a>. Furthermore, tailor-made learning and development recommendations, a core component of effective career guidance, align with an individual's interests, skills, and intended career path, ultimately leading to:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>Improved talent outcomes</li>
                <li>Higher employee satisfaction <a href="https://info.recruitics.com/blog/career-pathing-and-employee-retention" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[14]</a></li>
              </ul>
              
              <p>
                The emphasis on "personalized" and "tailor-made" guidance is critical for effective interventions.
              </p>
            </CardContent>
          </Card>

          {/* Conclusion */}
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Conclusion: Empowering Informed Career Decisions in an Evolving World</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="mb-4">
                The data presented paints a compelling picture of a global workforce grappling with profound career uncertainty and dissatisfaction. From adolescents struggling with initial career choices and facing long-term wage penalties <a href="https://www.oecd.org/en/publications/teenage-career-uncertainty_e89c3da9-en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[1]</a>, <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4273913/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[2]</a>, to adults experiencing widespread disengagement and regret over unfulfilled professional lives <a href="https://www.talenlio.com/blog/i-hate-my-job-the-silent-epidemic-affecting-85-of-global-workers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[5]</a>, <a href="https://www.gallup.com/workplace/654911/employee-engagement-sinks-year-low.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[6]</a>, <a href="https://fastcompanyme.com/work-life/this-is-the-most-common-career-regret-and-its-easy-to-avoid/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[7]</a>, the pervasive need for effective career guidance is undeniable.
              </p>
              
              <p className="mb-4">
                This widespread malaise is fueled by a critical personal-professional alignment gap, where individuals often struggle to connect their intrinsic values and aspirations with their professional realities <a href="https://interact-global.co/personal-values-vs-company-values-alignment/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[15]</a>. It is further exacerbated by the disruptive forces of artificial intelligence and rapidly evolving skill demands, which create job insecurity and necessitate continuous adaptation <a href="https://www.pewresearch.org/social-trends/2025/02/25/u-s-workers-are-more-worried-than-hopeful-about-future-ai-use-in-the-workplace/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[18]</a>, <a href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[21]</a>. Compounding these challenges are significant shortcomings in traditional organizational career development and management, leaving many employees without adequate internal support <a href="https://www2.deloitte.com/us/en/pages/about-deloitte/articles/press-releases/deloitte-report-aims-to-help-leaders-navigate-complex-workplace-tensions.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[20]</a>, <a href="https://learning.linkedin.com/content/dam/me/learning/en-us/images/lls-workplace-learning-report/2025/full-page/pdfs/LinkedIn-Workplace-Learning-Report-2025.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[22]</a>.
              </p>
              
              <p className="mb-4">
                The consequences of this uncertainty are far-reaching:
              </p>
              
              <ul className="mb-4 list-disc pl-6">
                <li>Individual impact: Increased stress and anxiety, affecting mental health and well-being <a href="https://www.apa.org/pubs/reports/work-in-america/2025" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[23]</a>, <a href="https://headington-institute.org/blog/resource/10-tips-managing-wellbeing-career-uncertainty/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[24]</a></li>
                <li>Business impact: Reduced organizational productivity, diminished employee engagement, and higher turnover rates <a href="https://www.apa.org/pubs/reports/work-in-america/2025" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[23]</a>, <a href="https://elearningindustry.com/job-satisfaction-statistics-key-data-and-insights" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[26]</a></li>
              </ul>
              
              <p className="mb-4">
                In this complex landscape, a substantial and growing market for career counseling and coaching already exists <a href="https://www.ibisworld.com/united-states/market-size/job-training-career-counseling/1616/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[27]</a>, with a clear preference for proactive, solution-oriented coaching approaches <a href="https://www.naceweb.org/career-development/organizational-structure/primary-focus-career-coaching-vs-career-counseling/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">[28]</a>.
              </p>
              
              <p>
                This report underscores the critical need for effective interventions. Providing individuals with personalized insights and actionable pathways can bridge the gap between personal aspirations and market realities, mitigate anxiety induced by technological disruption, and compensate for deficiencies in traditional organizational support. In an era of unprecedented change and uncertainty, empowering individuals with informed career decisions is not merely a personal benefit; it's a strategic imperative for fostering a resilient, productive, and thriving global workforce.
              </p>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Career?</h3>
            <p className="text-lg mb-6">
              Don't let career uncertainty hold you back. Discover personalized insights and actionable pathways for your professional future.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/')}
            >
              Take the Career Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
