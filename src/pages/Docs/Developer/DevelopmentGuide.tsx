import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Code, GitBranch, CheckCircle, Terminal, Settings } from "lucide-react";

export default function DevelopmentGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Development Guide</h1>
            <p className="text-muted-foreground mt-1">
              Setup and contribute to CodeCrow development
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Required</h3>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Java 17 JDK
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Maven 3.8+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Python 3.10+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Node.js 18+ (npm or bun)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Docker & Docker Compose
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Recommended</h3>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  IntelliJ IDEA (Java)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  VS Code (Frontend/Python)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Lombok plugin
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Development Setup</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Start Infrastructure */}
          <div className="space-y-2">
            <h3 className="font-semibold">1. Start Infrastructure Services</h3>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
              <pre>{`cd deployment
docker compose up -d postgres redis qdrant`}</pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Starts only databases, allowing you to run app services locally.
            </p>
          </div>

          {/* Java Setup */}
          <div className="space-y-2">
            <h3 className="font-semibold">2. Java Development</h3>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
              <pre>{`# Web Server (port 8081)
cd java-ecosystem/services/web-server
mvn spring-boot:run

# Pipeline Agent (port 8082)
cd java-ecosystem/services/pipeline-agent
mvn spring-boot:run`}</pre>
            </div>
          </div>

          {/* Python Setup */}
          <div className="space-y-2">
            <h3 className="font-semibold">3. Python Development</h3>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
              <pre>{`# MCP Client (port 8000)
cd python-ecosystem/mcp-client
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
uvicorn main:app --reload --port 8000

# RAG Pipeline (port 8001)
cd python-ecosystem/rag-pipeline
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
uvicorn main:app --reload --port 8001`}</pre>
            </div>
          </div>

          {/* Frontend Setup */}
          <div className="space-y-2">
            <h3 className="font-semibold">4. Frontend Development</h3>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
              <pre>{`cd frontend
npm install  # or: bun install
npm run dev  # or: bun run dev
# Access: http://localhost:5173`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Git Workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle>Git Workflow</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branch Strategy */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Branch Strategy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Badge>main</Badge>
                <span className="text-sm text-muted-foreground">Production-ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">develop</Badge>
                <span className="text-sm text-muted-foreground">Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">feature/*</Badge>
                <span className="text-sm text-muted-foreground">New features</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">bugfix/*</Badge>
                <span className="text-sm text-muted-foreground">Bug fixes</span>
              </div>
            </div>
          </div>

          {/* Commit Convention */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Commit Convention</h3>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
              <pre>{`feat: Add user authentication
fix: Resolve database connection issue
docs: Update API documentation
refactor: Simplify analysis service
test: Add unit tests for project service
chore: Update dependencies`}</pre>
            </div>
          </div>

          {/* PR Process */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Pull Request Process</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">1.</span>
                Create feature branch from <code className="bg-muted px-1 rounded">develop</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">2.</span>
                Implement changes with tests
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">3.</span>
                Update documentation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">4.</span>
                Create pull request
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">5.</span>
                Code review and approval
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">6.</span>
                Merge after approval
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Code Standards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <CardTitle>Code Standards</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Java */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Java</Badge>
              <span className="text-sm text-muted-foreground">Google Java Style Guide</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{`@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    
    @Transactional(readOnly = true)
    public Project findById(UUID id) {
        return projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
    
    @Transactional
    public Project create(ProjectCreateRequest request) {
        log.info("Creating project: {}", request.getName());
        
        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .build();
            
        return projectRepository.save(project);
    }
}`}</pre>
            </div>
          </div>

          {/* Python */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Python</Badge>
              <span className="text-sm text-muted-foreground">PEP 8, Type Hints</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{`from fastapi import APIRouter, Depends
from pydantic import BaseModel

class AnalysisRequest(BaseModel):
    project_id: str
    analysis_type: str
    changed_files: list[dict]

@router.post("/review")
async def analyze_code(
    request: AnalysisRequest,
    service: AnalysisService = Depends()
) -> AnalysisResponse:
    """Analyze code changes and return issues."""
    return await service.analyze(request)`}</pre>
            </div>
          </div>

          {/* TypeScript */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>TypeScript</Badge>
              <span className="text-sm text-muted-foreground">ESLint, Prettier</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{`interface ProjectProps {
  id: string;
  name: string;
  description?: string;
}

export function ProjectCard({ id, name, description }: ProjectProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
    </Card>
  );
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Useful Commands */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle>Useful Commands</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <CommandRow label="Build Java" command="cd java-ecosystem && mvn clean install" />
            <CommandRow label="Run Tests" command="cd java-ecosystem && mvn test" />
            <CommandRow label="Lint Frontend" command="cd frontend && npm run lint" />
            <CommandRow label="Build Frontend" command="cd frontend && npm run build" />
            <CommandRow label="View Logs" command="docker compose logs -f <service>" />
            <CommandRow label="Rebuild Service" command="docker compose up -d --build <service>" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommandRow({ label, command }: { label: string; command: string }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium w-32">{label}</span>
      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{command}</code>
    </div>
  );
}
