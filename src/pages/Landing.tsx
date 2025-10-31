import { motion } from "framer-motion";
import { Shield, Zap, Eye, Brain, Database, Activity, Play, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const loadSampleData = useMutation(api.sampleData.loadSampleData);
  const dashboardMetrics = useQuery(api.dashboard.getDashboardMetrics);
  const threatFeed = useQuery(api.dashboard.getThreatFeed, { limit: 5 });

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleLoadSampleData = async () => {
    setIsLoadingData(true);
    try {
      const result = await loadSampleData();
      toast.success(`Sample data loaded: ${result.iocs} IOCs, ${result.logs} logs, ${result.analyses} analyses`);
    } catch (error) {
      toast.error("Failed to load sample data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Real-time Threat Detection",
      description: "Advanced AI-powered monitoring that identifies threats as they emerge, providing instant alerts and automated response capabilities.",
      color: "text-neon-green"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Machine learning algorithms analyze patterns, predict threats, and provide actionable intelligence with confidence scoring.",
      color: "text-neon-pink"
    },
    {
      icon: Eye,
      title: "Threat Hunting",
      description: "Proactive threat hunting tools that search across IOCs, logs, and analysis data to uncover hidden threats.",
      color: "text-neon-blue"
    },
    {
      icon: Database,
      title: "IOC Management",
      description: "Comprehensive database of Indicators of Compromise with real-time updates and threat intelligence feeds.",
      color: "text-neon-green"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-cyber dark">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="h-8 w-8 text-neon-green glow-green" />
              <span className="text-xl font-bold text-neon-green">ThreatIntel</span>
            </motion.div>
            
            <Button 
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/80"
              disabled={isLoading}
            >
              {isAuthenticated ? "Dashboard" : "Get Started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-primary/20 text-neon-green border-primary/30">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Threat Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-neon-green via-neon-pink to-neon-blue bg-clip-text text-transparent">
              Defend Against
              <br />
              <span className="text-neon-green glow-green">Cyber Threats</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Advanced threat intelligence platform that combines real-time monitoring, 
              AI-powered analysis, and proactive threat hunting to protect your organization 
              from sophisticated cyber attacks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/80 text-lg px-8"
                disabled={isLoading}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-neon-green mx-auto mb-4 glow-green" />
                      <p className="text-lg">Demo video coming soon</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-neon-green">
              Advanced Security Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive threat intelligence capabilities designed for modern cybersecurity teams
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm h-full">
                  <CardHeader>
                    <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      {dashboardMetrics && (
        <section className="py-20 px-4 bg-card/20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 text-neon-pink">
                Live Threat Intelligence
              </h2>
              <p className="text-xl text-muted-foreground">
                Real-time security metrics from our platform
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <Card className="bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-neon-green glow-green">
                    {dashboardMetrics.activeThreats}
                  </div>
                  <p className="text-muted-foreground">Active Threats</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-neon-pink">
                    {dashboardMetrics.logEvents}
                  </div>
                  <p className="text-muted-foreground">Log Events (24h)</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-neon-blue">
                    {dashboardMetrics.aiAnalyses}
                  </div>
                  <p className="text-muted-foreground">AI Analyses</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-neon-green">
                    {dashboardMetrics.recentThreats}
                  </div>
                  <p className="text-muted-foreground">Recent Threats</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleLoadSampleData}
                disabled={isLoadingData}
                className="bg-accent hover:bg-accent/80"
              >
                {isLoadingData ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Loading Sample Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Load Sample Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6 text-neon-green">
              Ready to Secure Your Organization?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of security professionals using ThreatIntel to stay ahead of cyber threats
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/80 text-lg px-8"
              >
                <Shield className="mr-2 h-5 w-5" />
                Get Started Now
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => window.open("mailto:sales@threatintel.com", "_blank")}
              >
                <Users className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-neon-green" />
            <span className="text-lg font-bold text-neon-green">ThreatIntel</span>
          </div>
          <p className="text-muted-foreground">
            Powered by{" "}
            <a
              href="https://vly.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-pink hover:text-neon-pink/80 transition-colors"
            >
              vly.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
