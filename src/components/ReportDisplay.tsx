import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, ChevronUp, User, Briefcase, Eye, ArrowRight } from 'lucide-react';

interface ReportDisplayProps {
  userEmail?: string;
  onSectionExpanded?: (expanded: boolean) => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ userEmail, onSectionExpanded }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Only show for Sjoerd's profile
  if (userEmail !== 'sjn.geurts@gmail.com') {
    return null;
  }

  const aboutYouContent = `
## EXECUTIVE SUMMARY

Sjoerd, you are a visionary adapter who thrives in innovative environments where you can exercise autonomy and creativity. With extensive experience in AI and tech startups, you excel at embracing change and envisioning new possibilities, particularly in project-based work where you're trusted to determine your own approach. Your entrepreneurial mindset, combined with your technical expertise in AI agentic workflows and business applications, positions you uniquely for roles that blend technological innovation with strategic oversight—aligning with your aspirations to gain diverse experience while maintaining the job satisfaction you value.

Your career advancement may be hindered by perfectionism and taking on excessive responsibility, which impacts your work-life balance—a priority you've clearly identified. Developing leadership and delegation skills will be crucial for achieving your long-term goal of running a successful business while maintaining personal autonomy. By addressing these challenges and building on your comfort with risk and change, you can create a career path that balances your entrepreneurial ambitions with your need for stability and work-life harmony, particularly as you navigate financial considerations that currently constrain your options.

## PERSONALITY AND TEAM DYNAMICS

Sjoerd, your profile reveals a fascinating blend of visionary thinking and adaptability that shapes how you interact with teams. As someone who "embraces the unknown as a chance to innovate" while maintaining a direct communication style, you create an environment where creative solutions can flourish without losing focus on objectives. This combination is particularly valuable in the AI and tech startup space where you've built your expertise, as these fields require both imaginative thinking and practical implementation.

Your preference for actively engaging in discussions while valuing recognition of individual contributions suggests you thrive in collaborative environments that still honor personal achievement. This balance becomes especially important as you navigate your transition from entrepreneurship to potentially employed roles, where team dynamics may differ significantly from what you've experienced as a founder or consultant.

Your challenge with delegation and trusting team members to complete tasks presents an interesting paradox when paired with your stated preference for a leadership style that delegates autonomy. This tension likely stems from your perfectionist tendencies rather than a fundamental distrust of others' capabilities. Consider implementing a "progressive trust framework" where you gradually increase delegation based on demonstrated competence, starting with smaller tasks and building to more significant responsibilities. This structured approach aligns with your preference for planning ahead while addressing your perfectionism.

Your ability to address disagreements directly while maintaining a focus on securing the best outcome for your team represents a valuable leadership quality. However, to maximize this strength, experiment with "perspective rotation sessions" where team members are asked to articulate viewpoints different from their own. This approach leverages your direct communication style while creating space for the diverse thinking that drives innovation in the AI and tech spaces where you excel.

As you pursue leadership development, focus on transforming your adaptability from an individual strength into a team capability. Your comfort with change and quick adjustment can become a competitive advantage for entire organizations when systematically shared through mentoring and process design. This approach not only addresses your interest in leadership development but also creates a multiplier effect for your natural strengths.

## YOUR STRENGTHS

Your profile highlights two exceptional strengths: being "The Adapter" who thrives amid change and "The Visionary" who envisions new possibilities. This powerful combination has served you well in the AI and tech startup ecosystem, enabling you to navigate the rapidly evolving landscape while maintaining a forward-looking perspective. Your creation of an AI agent for personality assessment demonstrates how you've already leveraged these strengths to produce innovative solutions that blend technical expertise with creative thinking.

Your comfort with risk, quick decision-making, and big-picture focus creates a leadership profile particularly suited to entrepreneurial and innovation-focused environments. These attributes allow you to see opportunities others might miss and move decisively to capture them—a valuable capability in both startup environments and established organizations seeking transformation.

To further leverage these strengths, consider developing what I call "vision-to-execution frameworks" that translate your big-picture ideas into structured implementation plans. These frameworks would bridge the gap between your visionary thinking and the practical execution needed to bring ideas to life, while accommodating your preference for project-based deadlines. Such frameworks could become valuable intellectual property that distinguishes you in leadership roles, particularly as you seek to gain experience in different industries or positions.

Your extensive familiarity with AI presents a unique opportunity to position yourself at the intersection of technological innovation and strategic leadership. Rather than viewing your AI expertise as merely technical knowledge, reframe it as a strategic lens through which you can help organizations envision and implement transformative change. This approach aligns with your interest in innovative environments while creating pathways to the leadership roles you're seeking to develop.

Consider creating "innovation sandboxes" within your current or future roles—designated spaces where you can apply your visionary thinking and adaptability to experiment with new approaches or technologies. These controlled environments allow you to demonstrate your strengths while managing the perfectionism that might otherwise delay implementation. By establishing clear boundaries and success metrics for these experiments, you create opportunities to showcase your capabilities while building the case for larger initiatives.

## OPPORTUNITIES FOR GROWTH

Your identified challenges around perfectionism, taking on excessive responsibility, and being overly critical create a constellation of related issues that may be hindering your career progression and work-life balance. These tendencies, while stemming from high standards and commitment to quality, can create bottlenecks in your effectiveness and limit your ability to scale your impact through others—a critical consideration given your interest in leadership development.

The tension between your work-life balance constraints and your entrepreneurial ambitions requires careful navigation. Your high rating of work-life balance as "very important" suggests this isn't an area where you're willing to compromise, yet your long-term goals of running a successful business and achieving career autonomy often demand significant time investment, at least initially.

To address your perfectionism and tendency to take on too much, implement a "strategic imperfection protocol"—a systematic approach to identifying where excellence is truly required versus where good enough will suffice. This might include categorizing tasks based on their strategic importance and visibility, then deliberately applying different quality standards to each category. This structured approach aligns with your planning preferences while creating space for the delegation necessary in leadership roles.

Your interest in developing leadership and team management skills presents an opportunity to transform your relationship with delegation. Rather than viewing delegation as simply offloading tasks, reframe it as a strategic leadership function that develops others while expanding your impact. Create a "delegation development matrix" that matches team members' growth needs with appropriate challenges, allowing you to systematically build both their capabilities and your trust in their execution.

The financial limitations you've identified as a barrier might benefit from creative approaches that leverage your entrepreneurial mindset. Consider developing "parallel value streams"—complementary professional activities that generate additional income while enhancing your primary career path. These might include consulting, creating digital products related to your AI expertise, or developing intellectual property that can be monetized. This approach addresses financial constraints while maintaining the work-life balance you value highly.

## YOUR (CAREER) VALUES

Your prioritization of job satisfaction, autonomy, and job stability reveals a professional identity centered on meaningful work where you have freedom to operate while maintaining security. This value profile aligns well with your entrepreneurial background and interest in innovative environments, yet also explains your current exploration of employed roles that might offer greater stability without sacrificing the autonomy you cherish.

The relatively lower ranking of accomplishment, recognition, and making an impact is intriguing given your entrepreneurial background, where these elements are often driving motivators. This suggests you're more intrinsically motivated by the work itself and the freedom to approach it on your terms, rather than external validation or broader impact metrics—a perspective that should significantly influence your career choices.

Develop a "values alignment framework" for evaluating potential roles or projects. This framework should explicitly assess how each opportunity contributes to your core values of satisfaction, autonomy, and stability. For example, before pursuing a new position, systematically evaluate not just its compensation and responsibilities, but how it allows for creative freedom, meaningful work, and long-term security. This structured approach leverages your planning preference while ensuring your career moves align with your fundamental values.

Your preference for innovative, forward-thinking company cultures combined with your desire for project-based deadlines suggests you thrive in environments that balance creative freedom with clear objectives. When evaluating opportunities, look specifically for organizations that demonstrate this balance through their project management approaches and innovation processes. The ideal environment for you likely features clear goals and timelines but grants significant autonomy in how those objectives are achieved.

Consider implementing "value-protected time blocks" in your schedule—dedicated periods specifically aligned with your core values. For example, you might reserve time for creative exploration (satisfaction), self-directed projects (autonomy), and long-term planning (stability). By explicitly connecting time allocation to values, you create a practical mechanism for living your priorities daily, which addresses both your work-life balance concerns and your desire for meaningful professional engagement.
`;

  const careerSuggestionsContent = `
## TOP CAREER SUGGESTION (1)

### CHIEF STRATEGY OFFICER (CSO)
*Medium/Large (501-1,000), Established Organization*

You possess a strategic mindset and leadership prowess, making the Chief Strategy Officer (CSO) role an ideal fit. This position allows you to shape the company's vision and drive long-term growth, leveraging your expertise in strategic planning and financial analysis.

**Why a Medium/Large (501-1,000), Established Organization would suit you**

In a medium to large established organisation, you'll have the opportunity to influence significant strategic decisions and work closely with executive leadership. Typically, you would report to the CEO and collaborate with other C-suite executives, department heads, and key stakeholders to ensure cohesive strategy implementation.

**What you would do**
• Develop and communicate the company's strategic vision
• Identify new growth opportunities and potential acquisitions
• Oversee market research and competitive analysis
• Align departmental strategies with overall corporate goals

**Pros & Cons of this role**

**Pros**
• High impact: Directly influence the company's strategic direction
• Leadership opportunities: Lead cross-functional teams and initiatives
• Competitive compensation: Significant earning potential

**Cons**
• Demanding schedule: Often requires long hours and flexibility
• High pressure: Responsibility for major strategic outcomes

**Potential for growth**
Progression to Chief Executive Officer (CEO) or Board Member/Advisor roles.

**Compensation**
In your region, typical median annual salaries range from €230,000 to €460,000.

**Alignment with your ambitions**
In the short-term, leverage your strategic and leadership skills to drive impactful initiatives. Looking to the long-term, this role aligns with your goal of reaching a senior leadership position, although the demanding hours might pose work-life balance challenges.

**Future Outlook of the industry, this role and the impact of AI**
AI is enhancing strategic analysis by providing deeper insights and predictive analytics, enabling CSOs to make more informed decisions. However, the role's reliance on human judgement, leadership, and the ability to navigate complex organisational dynamics ensures its continued importance despite technological advancements.

## TOP CAREER SUGGESTION (2)

### VP, STRATEGIC INITIATIVES
*Large (1,001-5,000), Corporate Environment*

As the VP of Strategic Initiatives, you will lead cross-functional projects that drive organisational growth and efficiency. Your ability to manage complex projects and inspire teams makes this role an excellent match for your career aspirations and strengths.

**Why a Large (1,001-5,000), Corporate Environment would suit you**

Working in a large corporate environment provides the scale needed to implement high-impact strategic projects. You will typically report to a Senior VP or C-suite executive and collaborate with various departmental leaders, project managers, and cross-functional teams to achieve strategic objectives.

**What you would do**
• Define project scope, goals, and deliverables
• Manage project budgets and timelines
• Collaborate with cross-functional teams to execute initiatives
• Monitor progress and report results to stakeholders

**Pros & Cons of this role**

**Pros**
• High influence: Drive significant strategic projects with visible outcomes
• Leadership growth: Enhance your ability to lead large, diverse teams
• Competitive compensation: Attractive salary and benefits

**Cons**
• High workload: Managing multiple projects simultaneously can be stressful
• Complexity: Navigating large corporate structures can pose challenges

**Potential for growth**
Advancement to Senior VP, Strategic Initiatives or Chief Strategy Officer (CSO).

**Compensation**
In your region, typical median annual salaries range from €165,600 to €276,000.

**Alignment with your ambitions**
In the short-term, this role allows you to effectively manage strategic projects, providing immediate accomplishments and recognition. In the long-term, it supports your ambition to reach higher executive positions, though balancing multiple high-profile projects may challenge your work-life balance.

**Future Outlook of the industry, this role and the impact of AI**
AI tools streamline project management and data analysis, enhancing efficiency and decision-making. While routine tasks may be automated, the strategic and leadership aspects of the VP role remain reliant on human expertise, ensuring the role's relevance and importance in steering corporate initiatives.

## TOP CAREER SUGGESTION (3)

### BUSINESS STRATEGIST
*Large (1,001-5,000), Corporate Environment*

As a Business Strategist, you will analyse market trends and internal capabilities to develop strategies that enhance organisational performance and achieve long-term goals. Your analytical skills and strategic mindset make this role a suitable fit for your career path.

**Why a Large (1,001-5,000), Corporate Environment would suit you**

In a large corporate setting, you have access to extensive resources and diverse teams to implement strategic initiatives. Typically, you would report to a Director of Strategy or a similar senior role and work closely with cross-functional teams, including marketing, finance, and operations departments.

**What you would do**
• Conduct market research and competitive analysis
• Develop strategic recommendations and business plans
• Present findings to senior leadership
• Monitor and evaluate the effectiveness of strategic initiatives

**Pros & Cons of this role**

**Pros**
• Strategic impact: Directly influence the company's direction and success
• Analytical growth: Enhance your market and financial analysis skills
• Collaborative environment: Work with diverse teams and stakeholders

**Cons**
• High expectations: Delivering effective strategic recommendations can be pressure-filled
• Complexity: Managing and aligning multiple strategic initiatives can be challenging

**Potential for growth**
Advancement to Senior Business Strategist or Director of Strategy.

**Compensation**
In your region, typical median annual salaries range from €138,000 to €230,000.

**Alignment with your ambitions**
In the short-term, utilise your analytical and strategic skills to drive impactful projects, gaining recognition and professional growth. In the long-term, this role supports your goal to ascend to senior leadership positions, though the high level of responsibility may require careful management to maintain work-life balance.

**Future Outlook of the industry, this role and the impact of AI**
AI enhances the Business Strategist role by providing advanced data analytics and market forecasting tools. However, strategic intuition and the ability to interpret complex human factors remain essential, ensuring that human strategists continue to play a critical role in shaping business directions despite technological advancements.

## RUNNER-UP CAREERS

Sjoerd's skills and experience lend themselves to a variety of leadership and strategic roles across different organizational settings. Here are some promising options, grouped by similar functions:

**A. Strategic Advisory & Consulting**

These roles leverage the candidate's analytical skills, problem-solving abilities, and communication skills to provide expert advice and guidance to organizations in established settings:

• **Senior Strategy Consultant:** Ideal for someone with experience in strategic roles and a passion for problem-solving. What this role does: Provide expert advice and guidance to organizations, manage client interactions, and deliver effective solutions. AI Impact: Supporting.

• **Chief of Staff:** A perfect role for those with strong organizational skills and the ability to proactively manage key initiatives. What this role does: Serve as a strategic advisor to senior leadership, manage complex projects, and facilitate communication across the organization. AI Impact: Supporting.

**B. Innovation & Growth Leadership**

These roles focus on driving innovation, identifying new opportunities, and fostering a culture of innovation, particularly within rapidly growing organizations:

• **Head of Innovation:** A role for creative and strategic thinkers eager to drive innovation in a fast-paced environment. What this role does: Drive innovation initiatives, identify new opportunities, and foster a culture of innovation within a growing organization. AI Impact: Developing.

• **Director of Corporate Development:** This role involves managing mergers, acquisitions, and strategic investments to drive growth and enhance shareholder value. What this role does: Oversee financial investments, analyze market trends, identify and evaluate potential M&A targets or strategic partners, lead due diligence processes, negotiate transaction terms, and develop strategic plans to maximize returns and achieve inorganic growth objectives. AI Impact: Supporting.

**C. Organizational Development & Effectiveness**

These roles are well-suited for Adapters and Communicators who thrive in implementing programs that improve organizational performance, and who possess long-term, big-picture thinking for strategic planning:

• **Director of Organizational Effectiveness:** This role focuses on enhancing organizational performance through targeted strategies. What this role does: Drive strategic initiatives to improve productivity and efficiency in established organizational environments. AI Impact: Supporting.

## OUTSIDE-THE-BOX CAREERS

### 1. LANDSCAPE ARCHITECT WITH AI SPECIALISATION

Combining your passion for gardening and DIY with your AI expertise could create a unique niche in designing smart, sustainable landscapes that adapt to environmental conditions. Your visionary thinking and adaptability would allow you to create innovative outdoor spaces that blend technology with nature, potentially revolutionising how we interact with green spaces. This role would satisfy your entrepreneurial spirit while allowing you to build tangible things, similar to your interest in building with your children.

Based on your feedback, it's clear this idea sparked considerable excitement, resonating strongly with your interests and entrepreneurial drive. Your immediate thoughts turned towards practicalities like market testing and business setup, suggesting a genuine interest in exploring this unique blend of AI and landscaping further as a viable venture.

AI Impact: Supporting; roles involve both human and automated tasks.

### 2. TECH-ENABLED COMEDY WRITER/PERFORMER

Your dream of being a stand-up comedian could be reimagined through the lens of your AI expertise, creating tech-infused comedy shows that explain complex concepts through humour. Your direct communication style and comfort with social interactions would serve you well in crafting and delivering performances that bridge the gap between technology and entertainment. This career path offers the autonomy you value while allowing you to exercise creativity in an innovative, forward-thinking way.

AI Impact: Minimal; roles require human-centric skills.

### 3. IMMERSIVE EXPERIENCE DESIGNER

Drawing on your background in video game publishing and AI, you could design interactive experiences for museums, corporate training, or public installations that blend physical and digital elements. Your ability to think outside the box and adapt quickly would be invaluable in creating engaging experiences that push technological boundaries while remaining accessible to users. This role would satisfy your interest in innovative technology while allowing you to exercise your creative vision in tangible, impactful ways.

AI Impact: Supporting; roles involve both human and automated tasks.

## DREAM JOB ANALYSIS

### Writer

**Feasibility: Moderate to Challenging**

**Alignment with your profile:**
• Your interest in communication and public speaking suggests writing aptitude
• Your experience in strategy could translate to business writing or thought leadership
• Your proudest achievement involves public speaking on mental health, indicating comfort with sharing ideas

**Gaps to address:**
• No mentioned writing experience or portfolio
• Career has been primarily in corporate strategy, not content creation
• Significant income reduction likely (compared to current 150-250K compensation)

**Realistic pathway:**
Start with thought leadership articles on business strategy while maintaining your current role. Build a portfolio through LinkedIn articles, guest posts on industry publications, and potentially a personal blog. Consider writing a book on strategy, leadership, or mental health in the workplace. This creates a foundation for a potential transition to writing later in your career.

### Board Member

**Feasibility: High (Medium-term goal)**

**Alignment with your profile:**
• Executive experience as VP Strategy
• 15+ years of professional experience
• Strong business, strategy, and markets interest
• Long-term goal of reaching senior leadership positions

**Gaps to address:**
• Need to expand network of board connections
• May need broader C-suite experience
• Specific industry expertise may need deepening

**Realistic pathway:**
This is your most attainable dream job. Continue advancing to C-suite roles while seeking board observer roles or non-profit board positions to gain experience. Join organizations like Women on Boards or similar networks. Your technology industry background is valuable for many boards seeking digital transformation expertise. Target board positions in 3-5 years.

### Executive Coach

**Feasibility: Moderate to High**

**Alignment with your profile:**
• Senior leadership experience provides credibility
• Interest in communication, leadership, and team management
• Experience with mental health advocacy suggests empathy
• Desire for work-life balance (coaching can offer flexibility)

**Gaps to address:**
• No mentioned coaching certifications or training
• Need to develop structured coaching methodology
• Building a client base requires networking and marketing

**Realistic pathway:**
Pursue executive coaching certification (ICF, EMCC, etc.) while in your current role. Begin coaching informally within your organization or through mentorship programs. Gradually build a client base through your professional network. This could start as a side business and transition to full-time as you build reputation and clientele.

### Most Realistic Recommendation

Based on your profile, I recommend pursuing **Board Membership** as your primary goal, while developing **Executive Coaching** skills as a complementary path. This combination:

1. Leverages your existing executive experience
2. Aligns with your long-term goals of senior leadership
3. Provides the work-life balance you seek
4. Allows you to utilize your communication skills and interest in leadership
5. Maintains your desired compensation level

A potential role that combines elements of your dream jobs would be a **Chief Strategy Officer with board appointments and mentoring responsibilities**. This would allow you to:
• Exercise strategic thinking
• Serve on boards (internal or external)
• Mentor and develop leaders
• Potentially write thought leadership content
• Maintain executive-level compensation

As per your request for a deeper dive, to make this combination role even more compelling, consider targeting companies with strong Environmental, Social, and Governance (ESG) commitments. Your strategic thinking can contribute to sustainable business practices, and your mental health advocacy can shape socially responsible policies. In addition, networking within the tech industry, highlighting your strategy experience and board interests, could unveil fractional CSO opportunities that permit board engagements and mentoring, potentially increasing work-life balance.

This approach builds on your strengths while addressing your desire for better work-life balance and confidence development.
`;

  const chapters = [
    {
      id: 'about-you',
      title: 'About You',
      icon: User,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop',
      sections: [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          description: 'Overview of your strengths, challenges, and career positioning.',
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop'
        },
        {
          id: 'personality-team',
          title: 'Personality and Team Dynamics',
          description: 'How you interact with teams and leadership considerations.',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop'
        },
        {
          id: 'strengths',
          title: 'Your Strengths',
          description: 'Key capabilities and how to leverage them effectively.',
          imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=300&fit=crop'
        },
        {
          id: 'growth',
          title: 'Opportunities for Growth',
          description: 'Areas for development and strategic improvement recommendations.',
          imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=300&fit=crop'
        },
        {
          id: 'values',
          title: 'Your (Career) Values',
          description: 'Core professional values and how they shape your career choices.',
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'career-suggestions',
      title: 'Career Suggestions for You',
      icon: Briefcase,
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop',
      sections: [
        {
          id: 'top-suggestions',
          title: 'Top Career Suggestions',
          description: 'Three primary career recommendations tailored to your profile.',
          imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop'
        },
        {
          id: 'runner-up',
          title: 'Runner-up Careers',
          description: 'Additional career options organized by function and industry.',
          imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=300&fit=crop'
        },
        {
          id: 'outside-box',
          title: 'Outside-the-Box Careers',
          description: 'Creative career combinations leveraging your unique interests.',
          imageUrl: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&h=300&fit=crop'
        },
        {
          id: 'dream-jobs',
          title: 'Dream Job Analysis',
          description: 'Feasibility analysis of your ideal career aspirations.',
          imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop'
        }
      ]
    }
  ];

  const getSectionContent = (chapterId: string, sectionId: string) => {
    const content = chapterId === 'about-you' ? aboutYouContent : careerSuggestionsContent;
    
    if (chapterId === 'about-you') {
      switch (sectionId) {
        case 'executive-summary':
          return content.split('## PERSONALITY AND TEAM DYNAMICS')[0];
        case 'personality-team':
          return content.split('## PERSONALITY AND TEAM DYNAMICS')[1]?.split('## YOUR STRENGTHS')[0];
        case 'strengths':
          return content.split('## YOUR STRENGTHS')[1]?.split('## OPPORTUNITIES FOR GROWTH')[0];
        case 'growth':
          return content.split('## OPPORTUNITIES FOR GROWTH')[1]?.split('## YOUR (CAREER) VALUES')[0];
        case 'values':
          return content.split('## YOUR (CAREER) VALUES')[1];
        default:
          return content;
      }
    } else {
      switch (sectionId) {
        case 'top-suggestions':
          return content.split('## RUNNER-UP CAREERS')[0];
        case 'runner-up':
          return content.split('## RUNNER-UP CAREERS')[1]?.split('## OUTSIDE-THE-BOX CAREERS')[0];
        case 'outside-box':
          return content.split('## OUTSIDE-THE-BOX CAREERS')[1]?.split('## DREAM JOB ANALYSIS')[0];
        case 'dream-jobs':
          return content.split('## DREAM JOB ANALYSIS')[1];
        default:
          return content;
      }
    }
  };

  const getNextSection = (currentChapterId: string, currentSectionId: string) => {
    const currentChapter = chapters.find(c => c.id === currentChapterId);
    if (!currentChapter) return null;

    const currentSectionIndex = currentChapter.sections.findIndex(s => s.id === currentSectionId);
    
    // If there's a next section in the same chapter
    if (currentSectionIndex < currentChapter.sections.length - 1) {
      return {
        chapterId: currentChapterId,
        section: currentChapter.sections[currentSectionIndex + 1]
      };
    }
    
    // If we're at the end of the first chapter, go to the first section of the next chapter
    if (currentChapterId === 'about-you') {
      const nextChapter = chapters.find(c => c.id === 'career-suggestions');
      if (nextChapter) {
        return {
          chapterId: 'career-suggestions',
          section: nextChapter.sections[0]
        };
      }
    }
    
    return null;
  };

  const handleSectionExpand = (sectionId: string) => {
    const newExpandedState = expandedSection === sectionId ? null : sectionId;
    setExpandedSection(newExpandedState);
    onSectionExpanded?.(newExpandedState !== null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Career Report</h2>
        <p className="text-sm text-gray-600">
          <em>These insights are adjusted based on feedback provided in the chat where relevant.</em>
        </p>
      </div>

      {/* Expanded Section View */}
      {expandedSection && (
        <Card className="mb-6">
          <CardContent className="p-0">
            {chapters.map(chapter => 
              chapter.sections.map(section => {
                if (section.id !== expandedSection) return null;
                
                const nextSection = getNextSection(chapter.id, section.id);
                
                return (
                  <div key={section.id}>
                    <div className="relative h-64 bg-gradient-to-r from-atlas-blue to-atlas-navy">
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                        <div className="p-6 text-white">
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                              <p className="text-lg opacity-90">{section.description}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => setExpandedSection(null)}
                              className="bg-white text-gray-900 hover:bg-gray-100"
                            >
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Collapse
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="prose prose-lg max-w-none">
                        <div 
                          className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                          style={{ 
                            fontSize: '16px',
                            lineHeight: '1.7'
                          }}
                        >
                          {getSectionContent(chapter.id, section.id)?.split('\n').map((paragraph, index) => {
                            if (paragraph.startsWith('## ')) {
                              return <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-atlas-navy">{paragraph.replace('## ', '')}</h3>;
                            }
                            if (paragraph.startsWith('### ')) {
                              return <h4 key={index} className="text-lg font-semibold mt-6 mb-3 text-atlas-blue">{paragraph.replace('### ', '')}</h4>;
                            }
                            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                              return <p key={index} className="font-semibold mt-4 mb-2 text-gray-900">{paragraph.replace(/\*\*/g, '')}</p>;
                            }
                            if (paragraph.startsWith('•')) {
                              return <p key={index} className="ml-6 mb-2">{paragraph}</p>;
                            }
                            if (paragraph.trim() === '') {
                              return <br key={index} />;
                            }
                            return <p key={index} className="mb-3">{paragraph}</p>;
                          })}
                        </div>
                      </div>
                      
                      {/* Next Section Navigation */}
                      {nextSection && (
                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => handleSectionExpand(nextSection.section.id)}
                            className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                          >
                            Next: {nextSection.section.title}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Chapter Columns */}
      {!expandedSection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chapters.map((chapter) => {
            const IconComponent = chapter.icon;

            return (
              <Card key={chapter.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-atlas-blue to-atlas-navy text-white p-0">
                  <div className="relative h-48">
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                      <div className="p-6 text-white">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-8 w-8" />
                          <CardTitle className="text-xl">{chapter.title}</CardTitle>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {chapter.sections.map((section) => (
                      <div key={section.id} className="border-b last:border-b-0 p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{section.title}</h4>
                            <p className="text-sm text-gray-600">{section.description}</p>
                          </div>
                          <button
                            onClick={() => handleSectionExpand(section.id)}
                            className="ml-4 text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline"
                          >
                            View content
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
