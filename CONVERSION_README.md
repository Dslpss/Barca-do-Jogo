# JavaScript to Java Conversion

This document shows the conversion of JavaScript `console.log("OLA")` to its Java equivalent.

## JavaScript Version (example.js)
```javascript
console.log("OLA");
```

## Java Version (Example.java)
```java
public class Example {
    public static void main(String[] args) {
        System.out.println("OLA");
    }
}
```

## Key Differences

1. **Output Method**: 
   - JavaScript: `console.log("OLA")`
   - Java: `System.out.println("OLA")`

2. **Structure**:
   - JavaScript: Can be a standalone statement
   - Java: Requires a class definition and main method

3. **Syntax**:
   - Both maintain the same string output: "OLA"
   - Java requires proper class structure and method declaration

## Testing

Both implementations produce identical output:
```
OLA
```

Run the JavaScript version:
```bash
node example.js
```

Run the Java version:
```bash
javac Example.java
java Example
```