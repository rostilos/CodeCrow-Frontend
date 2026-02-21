with open('src/pages/Account/AI/AISettings.tsx', 'r') as f:
    content = f.read()

# Fix the opening tags
target1 = """                </Dialog>
              </div>

              <Tabs defaultValue="connections" className="w-full">"""
replacement1 = """                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="space-y-6">
            <Tabs defaultValue="connections" className="w-full">"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced target1")

# Fix the closing tags
target2 = """      </Tabs>
    </div>
  );
}"""
replacement2 = """            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}"""

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced target2")

with open('src/pages/Account/AI/AISettings.tsx', 'w') as f:
    f.write(content)
