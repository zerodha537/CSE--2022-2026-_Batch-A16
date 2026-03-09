import subprocess
import tempfile
import os
import sys

class CodeSandbox:
    """Basic secure code execution sandbox (Python only)"""
    
    @staticmethod
    def execute_python_code(code, timeout=5):
        """
        Execute Python code in a restricted environment
        Returns: (output, error, success)
        """
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Restricted execution using subprocess with timeout
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                env={**os.environ, 'PYTHONPATH': ''}  # Restrict imports
            )
            
            output = result.stdout
            error = result.stderr
            
            # Clean up
            os.unlink(temp_file)
            
            return output, error, result.returncode == 0
            
        except subprocess.TimeoutExpired:
            # Clean up on timeout
            try:
                os.unlink(temp_file)
            except:
                pass
            return "", "Execution timeout (possible infinite loop)", False
        except Exception as e:
            return "", f"Execution error: {str(e)}", False
    
    @staticmethod
    def is_code_safe(code):
        """Basic safety check for dangerous operations"""
        dangerous_patterns = [
            'import os',
            'import sys',
            '__import__',
            'eval(',
            'exec(',
            'open(',
            'subprocess',
            'system(',
            'shutil',
            'socket',
            'requests',
            'urllib',
            'pickle',
            'yaml',
            'json.loads',
            'eval',
            'compile',
            'globals',
            'locals'
        ]
        
        code_lower = code.lower()
        for pattern in dangerous_patterns:
            if pattern in code_lower:
                return False
        
        return True
    
    @staticmethod
    def run_test_cases(code, test_cases):
        """Run code against test cases"""
        results = []
        
        for i, test_case in enumerate(test_cases):
            # Wrap code in test execution
            test_code = f"""
{code}

# Test case {i}
try:
    result = {test_case['function_call']}
    expected = {test_case['expected']}
    if result == expected:
        print(f"Test {i}: PASS")
    else:
        print(f"Test {i}: FAIL - Got {{result}}, Expected {{expected}}")
except Exception as e:
    print(f"Test {i}: ERROR - {{str(e)}}")
"""
            
            if not CodeSandbox.is_code_safe(test_code):
                results.append(f"Test {i}: REJECTED - Unsafe code detected")
                continue
            
            output, error, success = CodeSandbox.execute_python_code(test_code)
            
            if error:
                results.append(f"Test {i}: ERROR - {error[:100]}")
            else:
                results.append(output.strip())
        
        return results

# Sample test cases for common problems
SAMPLE_TEST_CASES = {
    "find_max": [
        {"function_call": "find_max([1, 5, 3, 9, 2])", "expected": 9},
        {"function_call": "find_max([-1, -5, -3])", "expected": -1},
        {"function_call": "find_max([42])", "expected": 42}
    ],
    "reverse_string": [
        {"function_call": "reverse_string('hello')", "expected": 'olleh'},
        {"function_call": "reverse_string('python')", "expected": 'nohtyp'},
        {"function_call": "reverse_string('')", "expected": ''}
    ],
    "factorial": [
        {"function_call": "factorial(5)", "expected": 120},
        {"function_call": "factorial(0)", "expected": 1},
        {"function_call": "factorial(1)", "expected": 1}
    ]
}