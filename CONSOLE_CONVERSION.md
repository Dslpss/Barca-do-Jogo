# JavaScript to C# Console Output Conversion

This document demonstrates the conversion of JavaScript `console.log("OLA")` to its C# equivalent using `Console.WriteLine()`.

## Original JavaScript Code
```javascript
// JavaScript version
console.log("OLA");
```

## C# Equivalent Code
```csharp
// C# version
Console.WriteLine("OLA");
```

## Full C# Program Structure
```csharp
// C# version - Converted from JavaScript console.log("OLA")
// This demonstrates the C# equivalent using Console.WriteLine()

// Equivalent to JavaScript: console.log("OLA")
Console.WriteLine("OLA");
```

## Key Differences

| Aspect | JavaScript | C# |
|--------|------------|-----|
| Method Name | `console.log()` | `Console.WriteLine()` |
| Case Sensitivity | `console` (lowercase) | `Console` (PascalCase) |
| Namespace | Global object | `System` namespace (implicit) |
| Compilation | Interpreted | Compiled |

## Output Comparison

Both implementations produce identical output:
```
OLA
```

## Files in this Repository

1. **demo-javascript.js** - JavaScript implementation
2. **csharp-demo/CSharpDemo/Program.cs** - C# implementation
3. **DemoCSharp.cs** - Alternative C# implementation (traditional structure)

## Running the Examples

### JavaScript
```bash
node demo-javascript.js
```

### C# 
```bash
cd csharp-demo/CSharpDemo
dotnet run
```

## Summary

The conversion successfully maintains the same functionality:
- Both output "OLA" to the console
- Both use proper syntax and formatting for their respective languages
- The C# version follows .NET naming conventions
- Both implementations are minimal and focused on the core requirement