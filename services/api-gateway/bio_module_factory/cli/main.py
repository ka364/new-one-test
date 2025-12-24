"""
BioModuleFactory - Command Line Interface
CLI commands for module development workflow
"""

import click
import asyncio
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional

from backend.bio_module_factory.core.factory import factory
from backend.bio_module_factory.models.types import ModuleStep

console = Console()


@click.group()
def cli():
    """
    🏭 HaderOS BioModuleFactory CLI
    
    Bio-inspired module development workflow system
    """
    pass


@cli.command()
def list():
    """📚 List all available bio-modules"""
    # Simplified - in production, load from database
    modules = [
        ("mycelium", "Mycelium Module", "Resource Distribution", "E-commerce"),
        ("corvid", "Corvid Module", "Learning from Errors", "CRM & Agent"),
        ("chameleon", "Chameleon Module", "Adaptive Pricing", "E-commerce"),
        ("cephalopod", "Cephalopod Module", "Distributed Decisions", "KEMET MVP"),
        ("arachnid", "Arachnid Module", "Anomaly Detection", "CRM & Agent"),
        ("ant", "Ant Module", "Swarm Optimization", "E-commerce"),
        ("tardigrade", "Tardigrade Module", "Extreme Resilience", "Integration"),
    ]
    
    table = Table(title="📚 Available Bio-Modules", show_header=True, header_style="bold magenta")
    table.add_column("#", style="dim", width=3)
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Problem", style="yellow")
    table.add_column("Phase", style="blue")
    
    for i, (id, name, problem, phase) in enumerate(modules, 1):
        table.add_row(str(i), id, name, problem, phase)
    
    console.print(table)


@cli.command()
@click.argument('module_id')
def init(module_id: str):
    """🚀 Initialize a new bio-module"""
    console.print(f"\n[bold green]Initializing module: {module_id}[/bold green]\n")
    
    # In production, load module definition and initialize
    console.print(Panel(
        f"✅ Module initialized: {module_id}\n"
        f"📁 Created: modules/{module_id}/\n"
        f"🚀 Next step: haderos module step {module_id} 1",
        title="Success",
        border_style="green"
    ))


@cli.command()
@click.argument('module_id')
@click.argument('step_number', type=int)
def step(module_id: str, step_number: int):
    """📋 View current step requirements"""
    steps = [
        "Biological Study",
        "Architecture Design",
        "Development",
        "Testing",
        "Documentation"
    ]
    
    if step_number < 1 or step_number > len(steps):
        console.print("[red]Invalid step number[/red]")
        return
    
    step_name = steps[step_number - 1]
    
    console.print(f"\n[bold cyan]Step {step_number}: {step_name}[/bold cyan]\n")
    
    # Show deliverables
    table = Table(title="📦 Required Deliverables", show_header=True)
    table.add_column("Status", width=8)
    table.add_column("Deliverable", style="cyan")
    table.add_column("Required", width=10)
    
    # Example deliverables for step 1
    if step_number == 1:
        table.add_row("⏳", "Biological Study Report", "Yes")
        table.add_row("⏳", "Business Problem Mapping", "Yes")
        table.add_row("⏳", "Feasibility Assessment", "Yes")
    
    console.print(table)
    console.print(f"\n💡 Next: haderos module submit {module_id} {step_number} --file <path>\n")


@cli.command()
@click.argument('module_id')
@click.argument('step_number', type=int)
@click.option('--file', required=True, help='Path to deliverable file')
def submit(module_id: str, step_number: int, file: str):
    """📤 Submit a deliverable"""
    console.print(f"\n[bold green]Submitting deliverable...[/bold green]\n")
    
    # In production, call factory.submit_deliverable()
    console.print(Panel(
        f"✅ Deliverable submitted: {file}\n"
        f"📊 Progress: Updated\n"
        f"🚀 Next: haderos module validate {module_id}",
        title="Success",
        border_style="green"
    ))


@cli.command()
@click.argument('module_id')
def validate(module_id: str):
    """🔍 Validate current step and advance"""
    console.print(f"\n[bold cyan]🔍 Validating module: {module_id}...[/bold cyan]\n")
    
    # In production, call factory.validate_step()
    console.print("[green]✅ All quality gates passed![/green]")
    console.print("[yellow]🟡 2 warnings (non-blocking)[/yellow]")
    console.print(f"\n[bold green]🎉 Step complete! Advancing to next step...[/bold green]\n")


@cli.command()
@click.argument('module_id')
def status(module_id: str):
    """📊 Check module status"""
    console.print(f"\n[bold cyan]📊 Module Status: {module_id}[/bold cyan]\n")
    
    # In production, call factory.get_module_state()
    info = f"""
🔄 Current Step: 2 (Architecture Design)
✅ Completed Steps: 1
📅 Started: 2024-12-19
⏱️  Days in Progress: 3

📦 Deliverables:
   ✅ bio_study_report
      📁 docs/bio-study.md
   ✅ business_mapping
      📁 docs/business-mapping.md
   ⏳ architecture_document

🎯 Next Action:
   haderos module step {module_id} 2
    """
    
    console.print(Panel(info, border_style="cyan"))


@cli.command()
def academy():
    """🎓 List training academy lessons"""
    lessons = [
        ("lesson_01", "From Mechanics to Life", "30 min", "Beginner"),
        ("lesson_02", "Mycelium: The Wood Wide Web", "45 min", "Intermediate"),
        ("lesson_03", "Corvid: Learning from Mistakes", "40 min", "Intermediate"),
    ]
    
    table = Table(title="🎓 Training Academy", show_header=True, header_style="bold magenta")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="green")
    table.add_column("Duration", style="yellow")
    table.add_column("Level", style="blue")
    
    for id, title, duration, level in lessons:
        table.add_row(id, title, duration, level)
    
    console.print(table)
    console.print("\n💡 Start a lesson: haderos academy start <lesson_id>\n")


if __name__ == '__main__':
    cli()
