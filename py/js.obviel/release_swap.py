import os

if os.path.exists('js.obviel/resources_symlinked'):
    print "Post-release detected, swapping back"
    os.system('rm -rf js/obviel/resources')
    os.system('mv js/obviel/resources_symlinked js/obviel/resources')
else:
    print "Pre-release detected, swapping away symlink"
    os.system('mv js/obviel/resources js/obviel/resources_symlinked')
    os.system('cp -r js/obviel/resources_symlinked js/obviel/resources')

