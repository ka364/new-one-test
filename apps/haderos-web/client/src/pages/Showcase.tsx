import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Github,
  CheckCircle2,
  Code2,
  Database,
  Rocket,
  Shield,
  Brain,
  Blocks,
  TrendingUp,
  FileCode,
  TestTube,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

export default function Showcase() {
  const stats = [
    { label: 'Total Files', value: '60', change: '+14', icon: FileCode },
    { label: 'Lines of Code', value: '5,500+', change: '+2,829', icon: Code2 },
    { label: 'Test Cases', value: '38+', change: '+38', icon: TestTube },
    { label: 'Documentation Files', value: '7', change: '+3', icon: BookOpen },
  ];

  const features = [
    {
      icon: Shield,
      title: 'KAIA Theology Engine',
      description: 'Sharia compliance validation with automated Riba, Gharar, and Maysir detection',
      status: 'complete',
      items: ['7 database models', 'Compliance scoring', 'Automated recommendations'],
    },
    {
      icon: Blocks,
      title: 'ERC-3643 Blockchain',
      description: 'Security token integration with KYC/AML compliance',
      status: 'complete',
      items: ['Smart contracts', 'Token issuance', 'Investor registry'],
    },
    {
      icon: Brain,
      title: 'BioModuleFactory',
      description: '7 bio-inspired modules with state machine workflow',
      status: 'complete',
      items: ['CLI commands', 'Quality gates', 'Training academy'],
    },
    {
      icon: TrendingUp,
      title: 'ML/AI Risk Assessment',
      description: 'Multi-factor risk analysis with intelligent recommendations',
      status: 'complete',
      items: ['5 risk factors', 'Prediction engine', 'Smart suggestions'],
    },
  ];

  const techStack = [
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Python 3.11', category: 'Language' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Redis', category: 'Cache' },
    { name: 'Docker', category: 'Container' },
    { name: 'Prometheus', category: 'Monitoring' },
    { name: 'GitHub Actions', category: 'CI/CD' },
    { name: 'Pytest', category: 'Testing' },
  ];

  const achievements = [
    '✅ Docker + CI/CD (4 files, GitHub Actions)',
    '✅ Comprehensive testing (38+ test cases)',
    '✅ Enhanced documentation (10+ examples)',
    '✅ Frontend integration (API client + React components)',
  ];

  const commits = [
    { hash: 'cedbe11', message: 'Initial Python implementation' },
    { hash: '8fc1aac', message: 'Docker + docker-compose' },
    { hash: '9a9dbab', message: 'GitHub Actions CI/CD' },
    { hash: '22ba12b', message: 'Comprehensive test suite' },
    { hash: '74cddf0', message: 'Real-world examples' },
    { hash: '2db047d', message: 'Frontend integration guide' },
    { hash: '73798d4', message: 'Completion report' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container py-24 lg:py-32">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              v2.0.0 - Production Ready
            </Badge>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                HaderOS Platform
              </span>
              <span className="block text-3xl sm:text-4xl mt-4 text-muted-foreground">
                Ethical AI for Islamic Finance
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A production-ready platform combining <strong>Sharia compliance</strong>,
              <strong> blockchain technology</strong>, and <strong>AI/ML models</strong> for ethical
              investment management.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://github.com/ka364/haderos-platform"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2">
                  <Github className="h-5 w-5" />
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Explore Features
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold tracking-tight">Core Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Production-ready components built with Python, FastAPI, and modern AI/ML frameworks
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <Badge variant="secondary" className="mt-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                  <ul className="space-y-2">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold tracking-tight">Technology Stack</h2>
            <p className="text-lg text-muted-foreground">
              Built with modern, production-ready technologies
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <Badge key={index} variant="outline" className="text-base px-4 py-2">
                <Code2 className="h-4 w-4 mr-2" />
                {tech.name}
                <span className="ml-2 text-xs text-muted-foreground">{tech.category}</span>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Rocket className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">v2.0.0 Achievements</CardTitle>
                    <CardDescription>All improvements completed and deployed</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-base">{achievement}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* GitHub Commits Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold tracking-tight">Development Timeline</h2>
              <p className="text-lg text-muted-foreground">
                7 commits tracking the complete development journey
              </p>
            </div>

            <div className="space-y-3">
              {commits.map((commit, index) => (
                <Card key={index} className="border hover:border-primary transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="font-mono">
                        {commit.hash}
                      </Badge>
                      <span className="text-base flex-1">{commit.message}</span>
                      <Github className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <a
                href="https://github.com/ka364/haderos-platform/commits/main"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Github className="h-4 w-4" />
                  View All Commits
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="text-3xl">Comprehensive Documentation</CardTitle>
                <CardDescription className="text-base">
                  7 documentation files with 10+ real-world examples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <a
                    href="https://github.com/ka364/haderos-platform/blob/main/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="border hover:border-primary transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <span className="font-medium">README.md</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </a>

                  <a
                    href="https://github.com/ka364/haderos-platform/blob/main/docs/EXAMPLES.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="border hover:border-primary transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Code2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Examples Guide</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </a>

                  <a
                    href="https://github.com/ka364/haderos-platform/blob/main/docs/TESTING_GUIDE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="border hover:border-primary transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TestTube className="h-5 w-5 text-primary" />
                          <span className="font-medium">Testing Guide</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </a>

                  <a
                    href="https://github.com/ka364/haderos-platform/blob/main/COMPLETION_REPORT.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="border hover:border-primary transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Completion Report</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Ready for Production</h2>
            <p className="text-xl text-muted-foreground">
              All components tested, documented, and deployed to GitHub. Ready for beta testing and
              investor presentations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://github.com/ka364/haderos-platform"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2">
                  <Github className="h-5 w-5" />
                  Clone Repository
                </Button>
              </a>
              <a href="/">
                <Button size="lg" variant="outline">
                  Back to Home
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-semibold text-lg">HaderOS Platform</p>
                <p className="text-sm text-muted-foreground">Ethical AI for Islamic Finance</p>
              </div>
              <div className="flex gap-4">
                <a
                  href="https://github.com/ka364/haderos-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div className="border-t pt-6 text-center text-sm text-muted-foreground">
              <p>
                © 2024 HaderOS Platform. Built with 🧬 Bio-inspired Intelligence + 🕌 Islamic
                Finance + 🤖 AI/ML + ⛓️ Blockchain
              </p>
              <p className="mt-2">Version 2.0.0 - Production Ready</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
